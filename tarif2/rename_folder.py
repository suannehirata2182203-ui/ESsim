# -*- coding: utf-8 -*-
import os
import shutil

old_name = "Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files"
new_name = "files"

try:
    if os.path.exists(old_name):
        if os.path.exists(new_name):
            shutil.rmtree(new_name)
        os.rename(old_name, new_name)
        open("rename_success.txt", "w").write("OK")
except Exception as e:
    open("rename_error.txt", "w").write(str(e))


