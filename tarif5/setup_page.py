# -*- coding: utf-8 -*-
import os
import re
import shutil

# 1. Read original HTML
original_file = "Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI.html"
output_file = "index.html"

with open(original_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Replace resource paths
content = content.replace('Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files/', 'files/')

# 3. Replace links to digimobil.es
content = re.sub(r'href="https://www\.digimobil\.es/', 'href="/', content)
content = re.sub(r'href="//www\.digimobil\.es/', 'href="/', content)

# 4. Disable original shop.min.js script
content = re.sub(
    r'(\s*<script type="text/javascript">\s*\$\(document\)\.ready\(function\(\) \{\s*\$\.when\(\s*\$\.cachedScript\("/assets/.*?/js/shop\.min\.js"\))',
    r'\n    <script type="text/javascript">\n    // Original cart initialization disabled for local version\n    /*\n    $(document).ready(function() {\n        $.when(\n            $.cachedScript("/assets/2025.11.4/js/shop.min.js")',
    content,
    flags=re.DOTALL
)

# Find the closing of the cart initialization
content = re.sub(
    r'(new Cart\(params\);\s*\}\);\s*\}\);\s*</script>)',
    r'new Cart(params);\n            });\n        });\n        */\n    </script>',
    content
)

# 5. Add custom scripts before </body>
if '<script src="./tarif-calculator.js"></script>' not in content:
    content = content.replace(
        '</body>',
        '''    <!-- Custom Tariff Calculator -->
    <link rel="stylesheet" href="./custom-styles.css">
    <script src="./tarif-calculator.js"></script>

</body>'''
    )

# 6. Save
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

# 7. Rename folder
old_folder = "Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files"
new_folder = "files"

if os.path.exists(old_folder):
    if os.path.exists(new_folder):
        shutil.rmtree(new_folder)
    os.rename(old_folder, new_folder)

# 8. Copy custom-styles.css
if not os.path.exists("custom-styles.css"):
    shutil.copy("../tarif1/custom-styles.css", "custom-styles.css")

open("success.txt", "w").write("OK")
