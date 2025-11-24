# -*- coding: utf-8 -*-
import re

# Read tarif6/index.html
with open('tarif6/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Check if scripts are already present
if 'tarif-calculator.js' not in content:
    # Find </body> tag and add scripts before it
    if '</body>' in content:
        scripts = '''    <!-- Custom Tariff Calculator -->
    <link rel="stylesheet" href="./custom-styles.css">
    <script src="./tarif-calculator.js"></script>
    <script src="./payment-handler.js"></script>

</body>'''
        content = content.replace('</body>', scripts)
        
        # Save
        with open('tarif6/index.html', 'w', encoding='utf-8', errors='ignore') as f:
            f.write(content)
        print("✅ Added scripts to tarif6/index.html")
    else:
        print("❌ </body> tag not found")
else:
    print("✅ Scripts already present in tarif6/index.html")

