import re

def update_form(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove per from emptyItem
    content = re.sub(r", per: '.*?'", "", content)
    content = re.sub(r", per: ''", "", content)
    
    # Remove per from grid rendering
    content = re.sub(r"<div>\s*<label[^>]*>Per</label>\s*<input[^>]*name=\"per\"[^>]*/>\s*</div>", "", content)
    
    # Actually it's updating item.per
    content = re.sub(r"<div>\s*<label[^>]*>Per</label>\s*<input[^>]*value=\{item\.per\}[^>]*/>\s*</div>", "", content)
    
    # Update grid cols from 6 to 5 or something?
    # <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4
    content = content.replace('md:grid-cols-6', 'md:grid-cols-5')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_form(r'd:\Beam_ERP_New\frontend\src\components\Invoices.jsx')
update_form(r'd:\Beam_ERP_New\frontend\src\components\Quotations.jsx')

def update_pdf(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r"doc\.text\('Per', 170, currentY \+ 5, \{ align: 'center' \}\);", "", content)
    content = re.sub(r"doc\.text\(\(item\.per \|\| ''\)\.toString\(\)\.substring\(0, 10\), 170, currentY \+ ITEM_TOP_PADDING, \{ align: 'center' \}\);", "", content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_pdf(r'd:\Beam_ERP_New\frontend\src\utils\generatePDF.js')
print("Done")
