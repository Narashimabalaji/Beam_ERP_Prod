import re

limits = {
    'name="fromName"': 'maxLength={50}',
    'name="fromGstin"': 'maxLength={15}',
    'name="fromAddress"': 'maxLength={150}',
    'name="fromEmail"': 'maxLength={50}',
    'name="fromPhone"': 'maxLength={15}',
    'name="invoiceNo"': 'maxLength={20}',
    'name="placeOfSupply"': 'maxLength={30}',
    'name="clientName"': 'maxLength={50}',
    'name="phone"': 'maxLength={15}',
    'name="email"': 'maxLength={50}',
    'name="gstin"': 'maxLength={15}',
    'name="pan"': 'maxLength={10}',
    'name="billingAddress"': 'maxLength={150}',
    'name="termsConditions"': 'maxLength={500}',
    "'title'": 'maxLength={100}',
    "'description'": 'maxLength={200}',
    "'hsn'": 'maxLength={10}',
    "'tax'": 'maxLength={5}',
    "'qty'": 'maxLength={10}',
    "'rate'": 'maxLength={10}',
    "'per'": 'maxLength={10}',
    'gstPercent': 'maxLength={5}'
}

def add_max_length(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply limits to <input> and <textarea> tags
    def replace_func(match):
        tag = match.group(0)
        if 'maxLength=' in tag:
            return tag
            
        for key, limit_str in limits.items():
            if key in tag:
                if 'className=' in tag:
                    return tag.replace('className=', f'{limit_str} className=')
                else:
                    return tag.replace('/>', f' {limit_str} />').replace('></textarea>', f' {limit_str}></textarea>')
        return tag

    new_content = re.sub(r'<(input|textarea)[^>]*>', replace_func, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

add_max_length(r'd:\Beam_ERP_New\frontend\src\components\Invoices.jsx')
add_max_length(r'd:\Beam_ERP_New\frontend\src\components\Quotations.jsx')
print('Done!')
