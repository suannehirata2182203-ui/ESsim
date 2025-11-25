# -*- coding: utf-8 -*-
import os
import shutil

old_name = "Fibra + 2 líneas móvil _ Configura tu tarifa _ DIGI_files"
new_name = "files"

if os.path.exists(old_name):
    if os.path.exists(new_name):
        print(f"Removing existing {new_name}...")
        shutil.rmtree(new_name)
    
    print(f"Renaming {old_name} to {new_name}...")
    os.rename(old_name, new_name)
    print("Done!")
else:
    print(f"Source folder '{old_name}' not found!")


