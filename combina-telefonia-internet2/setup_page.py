# -*- coding: utf-8 -*-
import os
import re

# 1. Read original HTML
original_file = "Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI.html"
output_file = "index.html"

with open(original_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Replace resource paths
content = content.replace('Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files/', 'files/')

# 3. Replace links to digimobil.es
content = re.sub(r'href="https://www\.digimobil\.es/', 'href="../', content)

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

open("success.txt", "w").write("OK")
