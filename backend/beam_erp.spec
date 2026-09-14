# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Beam ERP backend
# Run: pyinstaller beam_erp.spec  (from inside the backend/ folder)

import os

block_cipher = None

# Path to the React build output (relative to this spec file location)
FRONTEND_DIST = os.path.abspath(os.path.join('..', 'frontend', 'dist'))

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # Bundle the React build inside the exe as 'static/'
        (FRONTEND_DIST, 'static'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'sqlalchemy.sql.default_comparator',
        'email.mime.text',
        'email.mime.multipart',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Set False for no console window (less debug info)
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend',
)
