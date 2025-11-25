# -*- coding: utf-8 -*-
import os
import re

# Читаем оригинальный файл
original_file = r"Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI.html"
output_file = "index.html"

with open(original_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем пути к ресурсам
content = content.replace('Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files/', 'files/')

# Заменяем ссылки на digimobil.es на локальные
content = re.sub(r'href="https://www\.digimobil\.es/', 'href="../', content)

# Сохраняем
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Done! Created {output_file}")
print(f"Original file size: {len(content)} characters")


