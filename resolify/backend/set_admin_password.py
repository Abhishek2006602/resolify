#!/usr/bin/env python3
"""Run once to set the admin password.
Usage: python set_admin_password.py
Requires: pip install passlib[bcrypt]
"""
import getpass
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("Set password for admin account (abhishekkamlakar425@gmail.com)")
password = getpass.getpass("Enter password: ")
confirm  = getpass.getpass("Confirm password: ")

if password != confirm:
    print("ERROR: Passwords do not match.")
    raise SystemExit(1)

if len(password) < 8:
    print("ERROR: Password must be at least 8 characters.")
    raise SystemExit(1)

hashed = pwd_context.hash(password)

print("\n--- Paste this SQL into Supabase SQL Editor ---\n")
print(f"UPDATE clients SET password_hash = '{hashed}' WHERE email = 'abhishekkamlakar24@vit.edu.in';\n")
print("------------------------------------------------")
