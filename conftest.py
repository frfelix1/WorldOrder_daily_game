"""Root conftest.py — adds the project root to sys.path for all pytest sessions."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
