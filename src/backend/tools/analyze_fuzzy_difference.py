#!/usr/bin/env python3
"""
Script untuk menganalisis detail perbedaan implementasi fuzzy_logic.py dengan FIS_SAW_fix.ipynb
"""

def analyze_membership_functions():
    """Analisis detail membership functions"""
    print("🔍 ANALISIS DETAIL MEMBERSHIP FUNCTIONS")
    print("=" * 50)
    
    # Data test
    ipk = 3.4
    sks = 150
    persen_dek = 0.0
    
    print(f"📊 Data Test:")
    print(f"   IPK: {ipk}")
    print(f"   SKS: {sks}")
    print(f"   Persen DEK: {persen_dek}")
    print()
    
    # Analisis IPK Membership
    print("📈 ANALISIS IPK MEMBERSHIP:")
    print("-" * 30)
    
    # fuzzy_logic.py implementation
    print("🐍 fuzzy_logic.py:")
    print("   IPK rendah: trapmf(0.0, 2.0, 2.5, 3.0)")
    print("   IPK sedang: trimf(2.8, 3.2, 3.6)")
    print("   IPK tinggi: trapmf(3.4, 3.7, 4.0, 4.0)")
    
    # Manual calculation untuk IPK = 3.4
    # IPK rendah: trapmf(0.0, 2.0, 2.5, 3.0)
    if 3.4 < 0.0 or 3.4 > 3.0:
        ipk_rendah = 0.0
    elif 2.5 <= 3.4 <= 3.0:
        ipk_rendah = 1.0
    elif 0.0 <= 3.4 < 2.0:
        ipk_rendah = (3.4 - 0.0) / (2.0 - 0.0) if 2.0 > 0.0 else 1.0
    else:  # 2.0 <= 3.4 < 2.5
        ipk_rendah = 1.0
    
    # IPK sedang: trimf(2.8, 3.2, 3.6)
    if 3.4 <= 2.8 or 3.4 >= 3.6:
        ipk_sedang = 0.0
    elif 3.4 == 3.2:
        ipk_sedang = 1.0
    elif 2.8 < 3.4 < 3.2:
        ipk_sedang = (3.4 - 2.8) / (3.2 - 2.8)
    else:  # 3.2 < 3.4 < 3.6
        ipk_sedang = (3.6 - 3.4) / (3.6 - 3.2)
    
    # IPK tinggi: trapmf(3.4, 3.7, 4.0, 4.0)
    if 3.4 < 3.4:
        ipk_tinggi = 0.0
    elif 3.4 >= 4.0:
        ipk_tinggi = 1.0
    elif 3.4 <= 3.4 < 3.7:
        ipk_tinggi = (3.4 - 3.4) / (3.7 - 3.4) if 3.7 > 3.4 else 1.0
    else:  # 3.7 <= 3.4 < 4.0
        ipk_tinggi = 1.0
    
    print(f"   IPK = {ipk}:")
    print(f"     rendah: {ipk_rendah:.6f}")
    print(f"     sedang: {ipk_sedang:.6f}")
    print(f"     tinggi: {ipk_tinggi:.6f}")
    
    print()
    print("📓 FIS_SAW_fix.ipynb:")
    print("   IPK rendah: fuzz.trapmf([0, 2, 2.5, 3.0])")
    print("   IPK sedang: fuzz.trimf([2.8, 3.2, 3.6])")
    print("   IPK tinggi: fuzz.trapmf([3.4, 3.7, 4.0, 4.0])")
    print("   (Menggunakan scikit-fuzzy library)")
    
    print()
    
    # Analisis SKS Membership
    print("📈 ANALISIS SKS MEMBERSHIP:")
    print("-" * 30)
    
    print("🐍 fuzzy_logic.py:")
    print("   SKS sedikit: trapmf(40, 90, 100, 120)")
    print("   SKS sedang: trimf(118, 140, 160)")
    print("   SKS banyak: trapmf(155, 170, 190, 200)")
    
    # Manual calculation untuk SKS = 150
    # SKS sedikit: trapmf(40, 90, 100, 120)
    if 150 < 40 or 150 > 120:
        sks_sedikit = 0.0
    elif 100 <= 150 <= 120:
        sks_sedikit = 1.0
    elif 40 <= 150 < 90:
        sks_sedikit = (150 - 40) / (90 - 40) if 90 > 40 else 1.0
    else:  # 90 <= 150 < 100
        sks_sedikit = (120 - 150) / (120 - 100) if 120 > 100 else 1.0
    
    # SKS sedang: trimf(118, 140, 160)
    if 150 <= 118 or 150 >= 160:
        sks_sedang = 0.0
    elif 150 == 140:
        sks_sedang = 1.0
    elif 118 < 150 < 140:
        sks_sedang = (150 - 118) / (140 - 118)
    else:  # 140 < 150 < 160
        sks_sedang = (160 - 150) / (160 - 140)
    
    # SKS banyak: trapmf(155, 170, 190, 200)
    if 150 < 155:
        sks_banyak = 0.0
    elif 155 <= 150 < 170:
        sks_banyak = (150 - 155) / (170 - 155) if 170 > 155 else 1.0
    elif 170 <= 150 <= 190:
        sks_banyak = 1.0
    else:  # 190 < 150 <= 200
        sks_banyak = (200 - 150) / (200 - 190) if 200 > 190 else 1.0
    
    print(f"   SKS = {sks}:")
    print(f"     sedikit: {sks_sedikit:.6f}")
    print(f"     sedang: {sks_sedang:.6f}")
    print(f"     banyak: {sks_banyak:.6f}")
    
    print()
    print("📓 FIS_SAW_fix.ipynb:")
    print("   SKS sedikit: fuzz.trapmf([40, 90, 100, 120])")
    print("   SKS sedang: fuzz.trimf([118, 140, 160])")
    print("   SKS banyak: fuzz.trapmf([155, 170, 190, 200])")
    
    print()
    
    # Analisis Nilai DEK Membership
    print("📈 ANALISIS NILAI DEK MEMBERSHIP:")
    print("-" * 30)
    
    print("🐍 fuzzy_logic.py:")
    print("   DEK sedikit: trapmf(0, 0, 4, 8)")
    print("   DEK sedang: trimf(7, 12, 18)")
    print("   DEK banyak: trapmf(16, 20, 45, 70)")
    
    # Manual calculation untuk persen_dek = 0.0
    # DEK sedikit: trapmf(0, 0, 4, 8)
    if 0.0 < 0:
        nilai_dek_sedikit = 0.0
    elif 0.0 >= 8:
        nilai_dek_sedikit = 1.0
    elif 0 <= 0.0 < 0:
        nilai_dek_sedikit = (0.0 - 0) / (0 - 0) if 0 > 0 else 1.0
    else:  # 0 <= 0.0 < 4
        nilai_dek_sedikit = 1.0
    
    # DEK sedang: trimf(7, 12, 18)
    if 0.0 <= 7 or 0.0 >= 18:
        nilai_dek_sedang = 0.0
    elif 0.0 == 12:
        nilai_dek_sedang = 1.0
    elif 7 < 0.0 < 12:
        nilai_dek_sedang = (0.0 - 7) / (12 - 7)
    else:  # 12 < 0.0 < 18
        nilai_dek_sedang = (18 - 0.0) / (18 - 12)
    
    # DEK banyak: trapmf(16, 20, 45, 70)
    if 0.0 < 16:
        nilai_dek_banyak = 0.0
    elif 16 <= 0.0 < 20:
        nilai_dek_banyak = (0.0 - 16) / (20 - 16) if 20 > 16 else 1.0
    elif 20 <= 0.0 <= 45:
        nilai_dek_banyak = 1.0
    else:  # 45 < 0.0 <= 70
        nilai_dek_banyak = (70 - 0.0) / (70 - 45) if 70 > 45 else 1.0
    
    print(f"   Persen DEK = {persen_dek}:")
    print(f"     sedikit: {nilai_dek_sedikit:.6f}")
    print(f"     sedang: {nilai_dek_sedang:.6f}")
    print(f"     banyak: {nilai_dek_banyak:.6f}")
    
    print()
    print("📓 FIS_SAW_fix.ipynb:")
    print("   DEK sedikit: fuzz.trapmf([0, 0, 4, 8])")
    print("   DEK sedang: fuzz.trimf([7, 12, 18])")
    print("   DEK banyak: fuzz.trapmf([16, 20, 45, 70])")
    
    return (ipk_rendah, ipk_sedang, ipk_tinggi), (sks_sedikit, sks_sedang, sks_banyak), (nilai_dek_sedikit, nilai_dek_sedang, nilai_dek_banyak)

def analyze_fuzzy_rules(ipk_memberships, sks_memberships, nilai_dk_memberships):
    """Analisis detail fuzzy rules"""
    print()
    print("🔍 ANALISIS FUZZY RULES")
    print("=" * 50)
    
    ipk_rendah, ipk_sedang, ipk_tinggi = ipk_memberships
    sks_sedikit, sks_sedang, sks_banyak = sks_memberships
    nilai_dek_sedikit, nilai_dek_sedang, nilai_dek_banyak = nilai_dk_memberships
    
    print(f"📊 Membership Values:")
    print(f"   IPK (rendah, sedang, tinggi): ({ipk_rendah:.6f}, {ipk_sedang:.6f}, {ipk_tinggi:.6f})")
    print(f"   SKS (sedikit, sedang, banyak): ({sks_sedikit:.6f}, {sks_sedang:.6f}, {sks_banyak:.6f})")
    print(f"   DEK (sedikit, sedang, banyak): ({nilai_dek_sedikit:.6f}, {nilai_dek_sedang:.6f}, {nilai_dek_banyak:.6f})")
    print()
    
    # Analisis rules yang aktif
    print("🎯 RULES YANG AKTIF:")
    print("-" * 30)
    
    # Rule 6: ipk['tinggi'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
    rule_6_strength = min(ipk_tinggi, sks_sedang, nilai_dek_sedikit)
    print(f"   Rule 6: ipk['tinggi'] & sks['sedang'] & nilai_dek['sedikit'] → 'tinggi'")
    print(f"     Strength: min({ipk_tinggi:.6f}, {sks_sedang:.6f}, {nilai_dek_sedikit:.6f}) = {rule_6_strength:.6f}")
    
    # Rule 4: ipk['sedang'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Tinggi']
    rule_4_strength = min(ipk_sedang, sks_sedang, nilai_dek_sedikit)
    print(f"   Rule 4: ipk['sedang'] & sks['sedang'] & nilai_dek['sedikit'] → 'tinggi'")
    print(f"     Strength: min({ipk_sedang:.6f}, {sks_sedang:.6f}, {nilai_dek_sedikit:.6f}) = {rule_4_strength:.6f}")
    
    # Rule 9: ipk['rendah'] & sks['sedang'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Sedang']
    rule_9_strength = min(ipk_rendah, sks_sedang, nilai_dek_sedikit)
    print(f"   Rule 9: ipk['rendah'] & sks['sedang'] & nilai_dek['sedikit'] → 'sedang'")
    print(f"     Strength: min({ipk_rendah:.6f}, {sks_sedang:.6f}, {nilai_dek_sedikit:.6f}) = {rule_9_strength:.6f}")
    
    # Rule 17: ipk['rendah'] & sks['banyak'] & nilai_dek['sedikit'] → kelulusan['Peluang_Lulus_Sedang']
    rule_17_strength = min(ipk_rendah, sks_banyak, nilai_dek_sedikit)
    print(f"   Rule 17: ipk['rendah'] & sks['banyak'] & nilai_dek['sedikit'] → 'sedang'")
    print(f"     Strength: min({ipk_rendah:.6f}, {sks_banyak:.6f}, {nilai_dek_sedikit:.6f}) = {rule_17_strength:.6f}")
    
    print()
    
    # Hitung output membership
    peluang_kecil = 0.0
    peluang_sedang = max(rule_9_strength, rule_17_strength)
    peluang_tinggi = max(rule_6_strength, rule_4_strength)
    
    print(f"📊 OUTPUT MEMBERSHIP:")
    print(f"   Peluang Kecil: {peluang_kecil:.6f}")
    print(f"   Peluang Sedang: {peluang_sedang:.6f}")
    print(f"   Peluang Tinggi: {peluang_tinggi:.6f}")
    
    return peluang_kecil, peluang_sedang, peluang_tinggi

def analyze_defuzzification(peluang_memberships):
    """Analisis detail defuzzification"""
    print()
    print("🔍 ANALISIS DEFUZZIFICATION")
    print("=" * 50)
    
    peluang_kecil, peluang_sedang, peluang_tinggi = peluang_memberships
    
    print("🐍 fuzzy_logic.py:")
    print("   Output values: [20, 50, 80]")
    print("   Method: Weighted average (centroid)")
    
    # Manual calculation
    numerator = (peluang_kecil * 20 + peluang_sedang * 50 + peluang_tinggi * 80)
    denominator = peluang_kecil + peluang_sedang + peluang_tinggi
    
    if denominator == 0:
        nilai_crisp = 0
    else:
        nilai_crisp = numerator / denominator
    
    print(f"   Calculation:")
    print(f"     Numerator: {peluang_kecil:.6f} * 20 + {peluang_sedang:.6f} * 50 + {peluang_tinggi:.6f} * 80 = {numerator:.6f}")
    print(f"     Denominator: {peluang_kecil:.6f} + {peluang_sedang:.6f} + {peluang_tinggi:.6f} = {denominator:.6f}")
    print(f"     Result: {numerator:.6f} / {denominator:.6f} = {nilai_crisp:.6f}")
    
    print()
    print("📓 FIS_SAW_fix.ipynb:")
    print("   Output values: [0-40, 30-70, 60-100]")
    print("   Method: scikit-fuzzy centroid method")
    print("   Result: 83.8677248677248")
    
    print()
    print("🔍 PERBEDAAN UTAMA:")
    print("-" * 30)
    print("1. Output crisp values berbeda:")
    print("   - fuzzy_logic.py: [20, 50, 80]")
    print("   - FIS_SAW_fix.ipynb: [0-40, 30-70, 60-100]")
    print()
    print("2. Defuzzification method:")
    print("   - fuzzy_logic.py: Simple weighted average")
    print("   - FIS_SAW_fix.ipynb: scikit-fuzzy centroid dengan universe [0, 101]")
    print()
    print("3. Precision:")
    print("   - fuzzy_logic.py: Manual calculation")
    print("   - FIS_SAW_fix.ipynb: Library calculation dengan numpy precision")
    
    return nilai_crisp

def main():
    """Main function"""
    print("🔍 ANALISIS DETAIL PERBEDAAN IMPLEMENTASI FUZZY")
    print("=" * 60)
    
    # Analisis membership functions
    ipk_memberships, sks_memberships, nilai_dk_memberships = analyze_membership_functions()
    
    # Analisis fuzzy rules
    peluang_memberships = analyze_fuzzy_rules(ipk_memberships, sks_memberships, nilai_dk_memberships)
    
    # Analisis defuzzification
    nilai_crisp = analyze_defuzzification(peluang_memberships)
    
    print()
    print("📊 KESIMPULAN:")
    print("=" * 30)
    print(f"   fuzzy_logic.py result: {nilai_crisp:.6f}")
    print(f"   FIS_SAW_fix.ipynb result: 83.8677248677248")
    print(f"   Difference: {abs(nilai_crisp - 83.8677248677248):.6f}")
    print()
    print("   Penyebab utama perbedaan:")
    print("   1. Output crisp values berbeda (20,50,80 vs 0-40,30-70,60-100)")
    print("   2. Defuzzification method berbeda (weighted average vs centroid)")
    print("   3. Precision calculation berbeda (manual vs library)")

if __name__ == "__main__":
    main() 