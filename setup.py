# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in frappe_tabulator/__init__.py
from frappe_tabulator import __version__ as version

setup(
	name='frappe_tabulator',
	version=version,
	description='Tabulator Tables for Frappe Reports',
	author='Vijay',
	author_email='datafeatures@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
