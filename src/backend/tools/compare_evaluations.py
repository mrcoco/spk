#!/usr/bin/env python3
"""
Script untuk membandingkan hasil evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

class FISEvaluationComparator:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = {}
        
    def run_previous_evaluation(self, test_size: float = 0.3, random_state: int = 42) -> Optional[Dict[str, Any]]:
        """Menjalankan evaluasi FIS yang sebelumnya (tanpa data aktual)"""
        print("🔄 Menjalankan evaluasi FIS yang sebelumnya...")
        
        url = f"{self.base_url}/api/fuzzy/evaluate"
        payload = {
            "test_size": test_size,
            "random_state": random_state,
            "evaluation_name": f"Previous_Evaluation_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "evaluation_notes": "Evaluasi FIS tanpa data aktual untuk perbandingan",
            "save_to_db": True
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            self.results['previous'] = result
            
            print("✅ Evaluasi FIS yang sebelumnya berhasil")
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error menjalankan evaluasi FIS yang sebelumnya: {e}")
            return None
    
    def run_actual_evaluation(self, test_size: float = 0.3, random_state: int = 42) -> Optional[Dict[str, Any]]:
        """Menjalankan evaluasi FIS dengan data aktual"""
        print("🔄 Menjalankan evaluasi FIS dengan data aktual...")
        
        url = f"{self.base_url}/api/fuzzy/evaluate-with-actual-status"
        payload = {
            "test_size": test_size,
            "random_state": random_state
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            self.results['actual'] = result
            
            print("✅ Evaluasi FIS dengan data aktual berhasil")
            return result
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error menjalankan evaluasi FIS dengan data aktual: {e}")
            return None
    
    def compare_metrics(self) -> Optional[Dict[str, Any]]:
        """Membandingkan metrik dari kedua evaluasi"""
        if 'previous' not in self.results or 'actual' not in self.results:
            print("❌ Data evaluasi tidak lengkap untuk perbandingan")
            return None
        
        previous = self.results['previous']
        actual = self.results['actual']['result']
        
        comparison = {
            'evaluation_date': datetime.now().isoformat(),
            'metrics_comparison': {},
            'data_comparison': {},
            'summary': {}
        }
        
        # Bandingkan metrik yang dapat dibandingkan
        if 'metrics' in previous and 'metrics' in actual:
            prev_metrics = previous['metrics']
            act_metrics = actual['metrics']
            
            comparison['metrics_comparison'] = {
                'accuracy': {
                    'previous': prev_metrics.get('accuracy', 'N/A'),
                    'actual': act_metrics.get('accuracy', 'N/A'),
                    'difference': self._calculate_difference(
                        prev_metrics.get('accuracy'), 
                        act_metrics.get('accuracy')
                    )
                },
                'precision': {
                    'previous': prev_metrics.get('precision_macro', 'N/A'),
                    'actual': act_metrics.get('precision', 'N/A'),
                    'difference': self._calculate_difference(
                        prev_metrics.get('precision_macro'), 
                        act_metrics.get('precision')
                    )
                },
                'recall': {
                    'previous': prev_metrics.get('recall_macro', 'N/A'),
                    'actual': act_metrics.get('recall', 'N/A'),
                    'difference': self._calculate_difference(
                        prev_metrics.get('recall_macro'), 
                        act_metrics.get('recall')
                    )
                },
                'f1_score': {
                    'previous': prev_metrics.get('f1_macro', 'N/A'),
                    'actual': act_metrics.get('f1_score', 'N/A'),
                    'difference': self._calculate_difference(
                        prev_metrics.get('f1_macro'), 
                        act_metrics.get('f1_score')
                    )
                }
            }
        
        # Bandingkan data
        if 'summary' in previous and 'evaluation_info' in actual:
            prev_summary = previous['summary']
            act_info = actual['evaluation_info']
            
            comparison['data_comparison'] = {
                'total_data': {
                    'previous': prev_summary.get('total_data', 'N/A'),
                    'actual': act_info.get('total_data', 'N/A')
                },
                'test_data': {
                    'previous': prev_summary.get('test_data', 'N/A'),
                    'actual': 'N/A'  # Tidak ada dalam evaluasi aktual
                },
                'execution_time': {
                    'previous': prev_summary.get('execution_time', 'N/A'),
                    'actual': 'N/A'  # Tidak ada dalam evaluasi aktual
                }
            }
        
        # Buat ringkasan
        comparison['summary'] = self._create_summary(comparison)
        
        return comparison
    
    def _calculate_difference(self, val1, val2):
        """Menghitung perbedaan antara dua nilai"""
        if val1 is None or val2 is None or val1 == 'N/A' or val2 == 'N/A':
            return 'N/A'
        
        try:
            diff = float(val2) - float(val1)
            return round(diff, 4)
        except (ValueError, TypeError):
            return 'N/A'
    
    def _create_summary(self, comparison: Dict[str, Any]) -> Dict[str, Any]:
        """Membuat ringkasan perbandingan"""
        summary = {
            'better_metrics': [],
            'worse_metrics': [],
            'equal_metrics': [],
            'overall_assessment': ''
        }
        
        metrics = comparison.get('metrics_comparison', {})
        
        for metric_name, metric_data in metrics.items():
            diff = metric_data.get('difference', 'N/A')
            
            if diff != 'N/A':
                if diff > 0:
                    summary['better_metrics'].append(metric_name)
                elif diff < 0:
                    summary['worse_metrics'].append(metric_name)
                else:
                    summary['equal_metrics'].append(metric_name)
        
        # Overall assessment
        better_count = len(summary['better_metrics'])
        worse_count = len(summary['worse_metrics'])
        
        if better_count > worse_count:
            summary['overall_assessment'] = f"Evaluasi dengan data aktual lebih baik ({better_count} vs {worse_count} metrik)"
        elif worse_count > better_count:
            summary['overall_assessment'] = f"Evaluasi sebelumnya lebih baik ({worse_count} vs {better_count} metrik)"
        else:
            summary['overall_assessment'] = "Kedua evaluasi memiliki performa yang sebanding"
        
        return summary
    
    def print_comparison(self, comparison: Dict[str, Any]):
        """Mencetak hasil perbandingan"""
        print("\n" + "="*80)
        print("📊 HASIL PERBANDINGAN EVALUASI FIS")
        print("="*80)
        
        # Metrik perbandingan
        print("\n🔍 PERBANDINGAN METRIK:")
        print("-" * 50)
        
        metrics = comparison.get('metrics_comparison', {})
        for metric_name, metric_data in metrics.items():
            print(f"\n{metric_name.upper()}:")
            print(f"  Sebelumnya: {metric_data['previous']}")
            print(f"  Data Aktual: {metric_data['actual']}")
            print(f"  Perbedaan: {metric_data['difference']}")
        
        # Perbandingan data
        print("\n📈 PERBANDINGAN DATA:")
        print("-" * 50)
        
        data_comp = comparison.get('data_comparison', {})
        for data_name, data_values in data_comp.items():
            print(f"\n{data_name.replace('_', ' ').title()}:")
            print(f"  Sebelumnya: {data_values['previous']}")
            print(f"  Data Aktual: {data_values['actual']}")
        
        # Ringkasan
        print("\n📋 RINGKASAN:")
        print("-" * 50)
        
        summary = comparison.get('summary', {})
        print(f"\nMetrik yang lebih baik dengan data aktual: {', '.join(summary['better_metrics']) if summary['better_metrics'] else 'Tidak ada'}")
        print(f"Metrik yang lebih baik sebelumnya: {', '.join(summary['worse_metrics']) if summary['worse_metrics'] else 'Tidak ada'}")
        print(f"Metrik yang sama: {', '.join(summary['equal_metrics']) if summary['equal_metrics'] else 'Tidak ada'}")
        print(f"\nPenilaian Keseluruhan: {summary['overall_assessment']}")
        
        print("\n" + "="*80)
    
    def save_comparison(self, comparison: Dict[str, Any], filename: Optional[str] = None):
        """Menyimpan hasil perbandingan ke file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"fis_evaluation_comparison_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(comparison, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Hasil perbandingan disimpan ke: {filename}")
            return filename
            
        except Exception as e:
            print(f"❌ Error menyimpan hasil perbandingan: {e}")
            return None
    
    def run_full_comparison(self, test_size: float = 0.3, random_state: int = 42, save_results: bool = True) -> Optional[Dict[str, Any]]:
        """Menjalankan perbandingan lengkap"""
        print("🚀 Memulai perbandingan evaluasi FIS...")
        print(f"📊 Parameter: test_size={test_size}, random_state={random_state}")
        
        # Jalankan kedua evaluasi
        previous_result = self.run_previous_evaluation(test_size, random_state)
        if previous_result is None:
            print("❌ Gagal menjalankan evaluasi sebelumnya")
            return None
        
        time.sleep(2)  # Jeda antara evaluasi
        
        actual_result = self.run_actual_evaluation(test_size, random_state)
        if actual_result is None:
            print("❌ Gagal menjalankan evaluasi dengan data aktual")
            return None
        
        # Bandingkan hasil
        comparison = self.compare_metrics()
        if comparison is None:
            print("❌ Gagal membandingkan hasil")
            return None
        
        # Tampilkan hasil
        self.print_comparison(comparison)
        
        # Simpan hasil jika diminta
        if save_results:
            self.save_comparison(comparison)
        
        return comparison

def main():
    """Fungsi utama"""
    print("🔬 FIS Evaluation Comparator")
    print("=" * 50)
    
    # Inisialisasi comparator
    comparator = FISEvaluationComparator()
    
    # Jalankan perbandingan
    try:
        comparison = comparator.run_full_comparison(
            test_size=0.3,
            random_state=42,
            save_results=True
        )
        
        if comparison:
            print("\n✅ Perbandingan evaluasi FIS berhasil diselesaikan!")
        else:
            print("\n❌ Perbandingan evaluasi FIS gagal!")
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Perbandingan dihentikan oleh user")
    except Exception as e:
        print(f"\n❌ Error tidak terduga: {e}")

if __name__ == "__main__":
    main() 