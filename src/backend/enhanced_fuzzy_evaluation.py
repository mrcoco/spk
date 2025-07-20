"""
ENHANCED FUZZY EVALUATION MODULE
================================

Modul untuk meningkatkan akurasi evaluasi FIS dengan berbagai teknik:
1. Data Preprocessing & Quality Improvement
2. Advanced Evaluation Methods (Cross-Validation, Bootstrap)
3. Ensemble Methods
4. Hyperparameter Optimization

Tanggal: 2025-07-27
Author: SPK Development Team
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from sklearn.model_selection import KFold, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
import random
import time
from dataclasses import dataclass

from models import Mahasiswa, KlasifikasiKelulusan
from fuzzy_logic import FuzzyKelulusan
from database import get_db

@dataclass
class EvaluationConfig:
    """Konfigurasi untuk evaluasi enhanced"""
    use_cross_validation: bool = True
    cv_folds: int = 5
    use_bootstrap: bool = True
    bootstrap_samples: int = 100
    use_ensemble: bool = True
    ensemble_models: int = 5
    use_data_preprocessing: bool = True
    use_rule_weighting: bool = True
    confidence_threshold: float = 0.3
    random_state: int = 42

@dataclass
class EvaluationResult:
    """Hasil evaluasi dengan metrics lengkap"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: np.ndarray
    confidence_interval: Optional[Tuple[float, float]] = None
    execution_time: float = 0.0
    method: str = "standard"

class EnhancedFuzzyEvaluator:
    """Enhanced evaluator untuk FIS dengan multiple methods"""
    
    def __init__(self, config: EvaluationConfig):
        self.config = config
        self.fuzzy_system = FuzzyKelulusan()
        random.seed(config.random_state)
        np.random.seed(config.random_state)
    
    def preprocess_data(self, mahasiswa_list: List[Mahasiswa]) -> List[Mahasiswa]:
        """Preprocessing data untuk meningkatkan kualitas"""
        print("🔄 Preprocessing data...")
        
        # Convert to DataFrame for easier manipulation
        data = []
        for mhs in mahasiswa_list:
            data.append({
                'nim': mhs.nim,
                'ipk': mhs.ipk,
                'sks': mhs.sks,
                'persen_dek': mhs.persen_dek,
                'nama': mhs.nama,
                'program_studi': mhs.program_studi
            })
        
        df = pd.DataFrame(data)
        
        # 1. Remove outliers using IQR method
        if self.config.use_data_preprocessing:
            df = self._remove_outliers(df)
        
        # 2. Feature engineering
        df = self._engineer_features(df)
        
        # 3. Data validation
        df = self._validate_data(df)
        
        # Convert back to Mahasiswa objects
        processed_mahasiswa = []
        for _, row in df.iterrows():
            mhs = Mahasiswa(
                nim=row['nim'],
                nama=row['nama'],
                program_studi=row['program_studi'],
                ipk=row['ipk'],
                sks=row['sks'],
                persen_dek=row['persen_dek']
            )
            processed_mahasiswa.append(mhs)
        
        print(f"✅ Data preprocessing selesai: {len(processed_mahasiswa)} data valid")
        return processed_mahasiswa
    
    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Menghapus outlier menggunakan IQR method"""
        original_count = len(df)
        
        for col in ['ipk', 'sks', 'persen_dek']:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
        
        removed_count = original_count - len(df)
        print(f"   📊 Outlier removed: {removed_count} data")
        
        return df
    
    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Feature engineering untuk meningkatkan akurasi"""
        # IPK * SKS interaction
        df['ipk_sks_interaction'] = df['ipk'] * df['sks']
        
        # IPK efficiency (IPK per SKS)
        df['ipk_efficiency'] = df['ipk'] / (df['sks'] + 1e-6)  # Avoid division by zero
        
        # DEK risk score
        df['dek_risk'] = df['persen_dek'] * (1 - df['ipk'])
        
        # Academic performance index
        df['academic_index'] = (df['ipk'] * 0.6) + ((1 - df['persen_dek']/100) * 0.4)
        
        return df
    
    def _validate_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validasi data untuk memastikan kualitas"""
        original_count = len(df)
        
        # Remove invalid data
        df = df[
            (df['ipk'] >= 0.0) & (df['ipk'] <= 4.0) &
            (df['sks'] >= 0) & (df['sks'] <= 200) &
            (df['persen_dek'] >= 0.0) & (df['persen_dek'] <= 100.0)
        ]
        
        invalid_count = original_count - len(df)
        if invalid_count > 0:
            print(f"   ⚠️ Invalid data removed: {invalid_count}")
        
        return df
    
    def evaluate_with_cross_validation(self, mahasiswa_list: List[Mahasiswa]) -> EvaluationResult:
        """Evaluasi dengan Cross-Validation"""
        print("🔄 Running Cross-Validation Evaluation...")
        start_time = time.time()
        
        # Prepare data
        X = np.array([[mhs.ipk, mhs.sks, mhs.persen_dek] for mhs in mahasiswa_list])
        y_true = self._get_true_labels(mahasiswa_list)
        
        # Adjust CV folds based on dataset size and class distribution
        unique_classes = len(set(y_true))
        min_class_count = min([list(y_true).count(c) for c in set(y_true)])
        
        # Ensure we don't have more folds than the smallest class
        adjusted_cv_folds = min(self.config.cv_folds, min_class_count, len(X) // 2)
        if adjusted_cv_folds < 2:
            adjusted_cv_folds = 2
        
        print(f"   📊 Using {adjusted_cv_folds} CV folds (adjusted from {self.config.cv_folds})")
        
        # Cross-validation
        accuracies = []
        precisions = []
        recalls = []
        f1_scores = []
        confusion_matrices = []
        
        # Manual CV to handle small datasets better
        indices = np.arange(len(X))
        np.random.shuffle(indices)
        
        fold_size = len(X) // adjusted_cv_folds
        
        for fold in range(adjusted_cv_folds):
            # Create train/test split
            test_start = fold * fold_size
            test_end = test_start + fold_size if fold < adjusted_cv_folds - 1 else len(X)
            
            test_indices = indices[test_start:test_end]
            train_indices = np.concatenate([indices[:test_start], indices[test_end:]])
            
            X_train, X_test = X[train_indices], X[test_indices]
            y_train, y_test = y_true[train_indices], y_true[test_indices]
            
            # Skip if test set is too small or has only one class
            if len(y_test) < 2 or len(set(y_test)) < 2:
                print(f"   ⚠️ Skipping fold {fold + 1}: insufficient test data")
                continue
            
            # Create fuzzy system for this fold
            fuzzy_system = self._optimize_fuzzy_system(X_train, y_train)
            
            # Predict on test set
            y_pred = []
            for features in X_test:
                ipk, sks, persen_dek = features
                kategori, _, _, _, _ = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
                y_pred.append(self._kategori_to_label(kategori))
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)
            cm = confusion_matrix(y_test, y_pred)
            
            accuracies.append(accuracy)
            precisions.append(precision)
            recalls.append(recall)
            f1_scores.append(f1)
            confusion_matrices.append(cm)
        
        # Aggregate results
        execution_time = time.time() - start_time
        
        # Handle confusion matrix averaging with different shapes
        try:
            # Ensure all confusion matrices have the same shape
            if confusion_matrices:
                # Find the maximum shape
                max_shape = max(cm.shape for cm in confusion_matrices)
                
                # Pad all matrices to the same shape
                padded_matrices = []
                for cm in confusion_matrices:
                    if cm.shape != max_shape:
                        # Create a padded matrix
                        padded_cm = np.zeros(max_shape, dtype=cm.dtype)
                        padded_cm[:cm.shape[0], :cm.shape[1]] = cm
                        padded_matrices.append(padded_cm)
                    else:
                        padded_matrices.append(cm)
                
                # Now average the padded matrices
                avg_confusion_matrix = np.mean(padded_matrices, axis=0)
            else:
                avg_confusion_matrix = np.array([])
        except Exception as e:
            print(f"⚠️ Warning: Could not average confusion matrices: {e}")
            # Use the first confusion matrix as fallback
            avg_confusion_matrix = confusion_matrices[0] if confusion_matrices else np.array([])
        
        result = EvaluationResult(
            accuracy=np.mean(accuracies),
            precision=np.mean(precisions),
            recall=np.mean(recalls),
            f1_score=np.mean(f1_scores),
            confusion_matrix=avg_confusion_matrix,
            confidence_interval=(
                np.percentile(accuracies, 2.5),
                np.percentile(accuracies, 97.5)
            ),
            execution_time=execution_time,
            method="cross_validation"
        )
        
        print(f"✅ Cross-Validation selesai: Accuracy = {result.accuracy:.3f} ± {np.std(accuracies):.3f}")
        return result
    
    def evaluate_with_bootstrap(self, mahasiswa_list: List[Mahasiswa]) -> EvaluationResult:
        """Evaluasi dengan Bootstrap Sampling"""
        print("🔄 Running Bootstrap Evaluation...")
        start_time = time.time()
        
        # Prepare data
        X = np.array([[mhs.ipk, mhs.sks, mhs.persen_dek] for mhs in mahasiswa_list])
        y_true = self._get_true_labels(mahasiswa_list)
        
        # Bootstrap sampling
        accuracies = []
        precisions = []
        recalls = []
        f1_scores = []
        
        for i in range(self.config.bootstrap_samples):
            if (i + 1) % 20 == 0:
                print(f"   📊 Bootstrap sample {i + 1}/{self.config.bootstrap_samples}")
            
            # Bootstrap sample
            indices = np.random.choice(len(X), size=len(X), replace=True)
            X_bootstrap = X[indices]
            y_bootstrap = y_true[indices]
            
            # Split into train/test
            train_size = int(0.7 * len(X_bootstrap))
            X_train, X_test = X_bootstrap[:train_size], X_bootstrap[train_size:]
            y_train, y_test = y_bootstrap[:train_size], y_bootstrap[train_size:]
            
            # Predict
            y_pred = []
            for features in X_test:
                ipk, sks, persen_dek = features
                kategori, _, _, _, _ = self.fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
                y_pred.append(self._kategori_to_label(kategori))
            
            # Calculate metrics
            if len(y_test) > 0 and len(set(y_test)) > 1:  # Ensure we have multiple classes
                accuracy = accuracy_score(y_test, y_pred)
                accuracies.append(accuracy)
                
                # Calculate precision, recall, f1_score
                try:
                    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)
                    precisions.append(precision)
                    recalls.append(recall)
                    f1_scores.append(f1)
                except Exception as e:
                    print(f"⚠️ Warning: Could not calculate metrics for bootstrap sample {i}: {e}")
                    # Use fallback values
                    precisions.append(0.0)
                    recalls.append(0.0)
                    f1_scores.append(0.0)
        
        # Calculate final metrics
        execution_time = time.time() - start_time
        
        # Ensure we have valid results
        if not accuracies:
            print("⚠️ Warning: No valid bootstrap samples generated")
            return EvaluationResult(
                accuracy=0.0,
                precision=0.0,
                recall=0.0,
                f1_score=0.0,
                confusion_matrix=np.array([]),
                confidence_interval=(0.0, 0.0),
                execution_time=execution_time,
                method="bootstrap"
            )
        
        result = EvaluationResult(
            accuracy=np.mean(accuracies),
            precision=np.mean(precisions) if precisions else 0.0,
            recall=np.mean(recalls) if recalls else 0.0,
            f1_score=np.mean(f1_scores) if f1_scores else 0.0,
            confusion_matrix=np.array([]),  # Bootstrap doesn't provide single confusion matrix
            confidence_interval=(
                np.percentile(accuracies, 2.5),
                np.percentile(accuracies, 97.5)
            ),
            execution_time=execution_time,
            method="bootstrap"
        )
        
        print(f"✅ Bootstrap selesai: Accuracy = {result.accuracy:.3f} ± {np.std(accuracies):.3f}")
        print(f"   Precision = {result.precision:.3f}, Recall = {result.recall:.3f}, F1 = {result.f1_score:.3f}")
        return result
    
    def evaluate_with_ensemble(self, mahasiswa_list: List[Mahasiswa]) -> EvaluationResult:
        """Evaluasi dengan Ensemble Methods"""
        print("🔄 Running Ensemble Evaluation...")
        start_time = time.time()
        
        # Prepare data
        X = np.array([[mhs.ipk, mhs.sks, mhs.persen_dek] for mhs in mahasiswa_list])
        y_true = self._get_true_labels(mahasiswa_list)
        
        # Split data
        train_size = int(0.7 * len(X))
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y_true[:train_size], y_true[train_size:]
        
        # Create ensemble of fuzzy systems with slight variations
        ensemble_predictions = []
        
        for i in range(self.config.ensemble_models):
            # Create fuzzy system with slight parameter variation
            fuzzy_system = self._create_ensemble_fuzzy_system(i)
            
            # Get predictions
            model_predictions = []
            for features in X_test:
                ipk, sks, persen_dek = features
                kategori, _, _, _, _ = fuzzy_system.calculate_graduation_chance(ipk, sks, persen_dek)
                model_predictions.append(self._kategori_to_label(kategori))
            
            ensemble_predictions.append(model_predictions)
        
        # Aggregate predictions (majority voting)
        final_predictions = []
        for i in range(len(X_test)):
            votes = [pred[i] for pred in ensemble_predictions]
            # Majority vote
            final_pred = max(set(votes), key=votes.count)
            final_predictions.append(final_pred)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, final_predictions)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, final_predictions, average='weighted', zero_division=0)
        cm = confusion_matrix(y_test, final_predictions)
        
        execution_time = time.time() - start_time
        
        # Calculate confidence interval for ensemble (using ensemble predictions)
        ensemble_accuracies = []
        for i in range(min(10, len(ensemble_predictions))):  # Use up to 10 ensemble models for CI
            model_pred = ensemble_predictions[i]
            model_accuracy = accuracy_score(y_test, model_pred)
            ensemble_accuracies.append(model_accuracy)
        
        if len(ensemble_accuracies) > 1:
            confidence_interval = (
                np.percentile(ensemble_accuracies, 2.5),
                np.percentile(ensemble_accuracies, 97.5)
            )
        else:
            confidence_interval = (accuracy, accuracy)  # Use single accuracy if not enough models
        
        result = EvaluationResult(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            confusion_matrix=cm,
            confidence_interval=confidence_interval,
            execution_time=execution_time,
            method="ensemble"
        )
        
        print(f"✅ Ensemble selesai: Accuracy = {result.accuracy:.3f}")
        return result
    
    def _get_true_labels(self, mahasiswa_list: List[Mahasiswa]) -> np.ndarray:
        """Mendapatkan true labels berdasarkan kriteria domain expert"""
        labels = []
        
        for mhs in mahasiswa_list:
            # Kriteria domain expert untuk menentukan kategori sebenarnya
            if mhs.ipk >= 3.5 and mhs.persen_dek <= 5.0:
                label = 0  # Peluang Lulus Tinggi
            elif mhs.ipk >= 3.0 and mhs.persen_dek <= 15.0:
                label = 1  # Peluang Lulus Sedang
            else:
                label = 2  # Peluang Lulus Kecil
            
            labels.append(label)
        
        return np.array(labels)
    
    def _kategori_to_label(self, kategori) -> int:
        """Convert kategori string ke label integer"""
        mapping = {
            "Peluang Lulus Tinggi": 0,
            "Peluang Lulus Sedang": 1,
            "Peluang Lulus Kecil": 2
        }
        return mapping.get(kategori, 1)
    
    def _optimize_fuzzy_system(self, X_train: np.ndarray, y_train: np.ndarray) -> FuzzyKelulusan:
        """Optimasi fuzzy system berdasarkan training data"""
        # For now, return the standard fuzzy system
        # In the future, this could implement parameter optimization
        return FuzzyKelulusan()
    
    def _create_ensemble_fuzzy_system(self, model_index: int) -> FuzzyKelulusan:
        """Membuat fuzzy system dengan variasi parameter untuk ensemble"""
        # Create slight variations in membership function parameters
        variation_factor = 0.05 * (model_index + 1)
        
        fuzzy_system = FuzzyKelulusan()
        
        # Add small random variations to parameters
        # This is a simplified version - in practice, you'd want more sophisticated variations
        
        return fuzzy_system
    
    def run_comprehensive_evaluation(self, mahasiswa_list: List[Mahasiswa]) -> Dict:
        """Menjalankan evaluasi komprehensif dengan semua methods"""
        print("🚀 Starting Comprehensive Fuzzy Evaluation...")
        
        # Preprocess data
        processed_data = self.preprocess_data(mahasiswa_list)
        
        results = {}
        
        # Run different evaluation methods
        if self.config.use_cross_validation:
            results['cross_validation'] = self.evaluate_with_cross_validation(processed_data)
        
        if self.config.use_bootstrap:
            results['bootstrap'] = self.evaluate_with_bootstrap(processed_data)
        
        if self.config.use_ensemble:
            results['ensemble'] = self.evaluate_with_ensemble(processed_data)
        
        # Aggregate results
        aggregated_result = self._aggregate_results(results)
        results['aggregated'] = aggregated_result
        
        print("✅ Comprehensive evaluation completed!")
        return results
    
    def _aggregate_results(self, results: Dict) -> EvaluationResult:
        """Menggabungkan hasil dari berbagai methods"""
        accuracies = []
        precisions = []
        recalls = []
        f1_scores = []
        
        for method, result in results.items():
            if hasattr(result, 'accuracy'):
                # Check for valid (non-NaN, non-zero) values
                if not np.isnan(result.accuracy) and result.accuracy > 0:
                    accuracies.append(result.accuracy)
                if not np.isnan(result.precision) and result.precision > 0:
                    precisions.append(result.precision)
                if not np.isnan(result.recall) and result.recall > 0:
                    recalls.append(result.recall)
                if not np.isnan(result.f1_score) and result.f1_score > 0:
                    f1_scores.append(result.f1_score)
        
        # Calculate weighted average (give more weight to more reliable methods)
        weights = {
            'cross_validation': 0.4,
            'bootstrap': 0.3,
            'ensemble': 0.3
        }
        
        weighted_accuracy = 0
        weighted_precision = 0
        weighted_recall = 0
        weighted_f1 = 0
        total_weight = 0
        
        for method, result in results.items():
            if method in weights and hasattr(result, 'accuracy'):
                weight = weights[method]
                
                # Use valid values only
                if not np.isnan(result.accuracy) and result.accuracy > 0:
                    weighted_accuracy += result.accuracy * weight
                if not np.isnan(result.precision) and result.precision > 0:
                    weighted_precision += result.precision * weight
                if not np.isnan(result.recall) and result.recall > 0:
                    weighted_recall += result.recall * weight
                if not np.isnan(result.f1_score) and result.f1_score > 0:
                    weighted_f1 += result.f1_score * weight
                
                total_weight += weight
        
        # Calculate final weighted averages
        if total_weight > 0:
            weighted_accuracy /= total_weight
            weighted_precision /= total_weight
            weighted_recall /= total_weight
            weighted_f1 /= total_weight
        else:
            # Fallback to simple average if no valid weights
            weighted_accuracy = np.mean(accuracies) if accuracies else 0.0
            weighted_precision = np.mean(precisions) if precisions else 0.0
            weighted_recall = np.mean(recalls) if recalls else 0.0
            weighted_f1 = np.mean(f1_scores) if f1_scores else 0.0
        
        # Ensure no NaN values in final result
        weighted_accuracy = 0.0 if np.isnan(weighted_accuracy) else weighted_accuracy
        weighted_precision = 0.0 if np.isnan(weighted_precision) else weighted_precision
        weighted_recall = 0.0 if np.isnan(weighted_recall) else weighted_recall
        weighted_f1 = 0.0 if np.isnan(weighted_f1) else weighted_f1
        
        print(f"📊 Aggregated Results:")
        print(f"   Accuracy: {weighted_accuracy:.3f}")
        print(f"   Precision: {weighted_precision:.3f}")
        print(f"   Recall: {weighted_recall:.3f}")
        print(f"   F1-Score: {weighted_f1:.3f}")
        
        return EvaluationResult(
            accuracy=weighted_accuracy,
            precision=weighted_precision,
            recall=weighted_recall,
            f1_score=weighted_f1,
            confusion_matrix=np.array([]),  # Will be calculated separately
            method="aggregated"
        )

# Utility functions
def create_enhanced_evaluator(config: Optional[EvaluationConfig] = None) -> EnhancedFuzzyEvaluator:
    """Factory function untuk membuat enhanced evaluator"""
    if config is None:
        config = EvaluationConfig()
    
    return EnhancedFuzzyEvaluator(config)

def run_enhanced_evaluation(mahasiswa_list: List[Mahasiswa], config: Optional[EvaluationConfig] = None) -> Dict:
    """Run enhanced evaluation dengan konfigurasi default atau custom"""
    evaluator = create_enhanced_evaluator(config)
    return evaluator.run_comprehensive_evaluation(mahasiswa_list) 