import sys, io, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BIKE_NAMES = {
    'sr400':    'Yamaha SR400/500',
    'srx':      'Yamaha SRX400-600',
    'xs650':    'Yamaha XS650/TX650',
    'xt500':    'Yamaha XT/TT500',
    'tdr':      'Yamaha TDR220',
    'r15':      'Yamaha R15/XSR155/XMAX300',
    'r3':       'Yamaha R3/MT-03/R25',
    'r1':       'Yamaha R1/R6/R7',
    'cb750':    'Honda CB750 k0-k7',
    'gb400':    'Honda GB250/400/CB400SS',
    'nc35':     'Honda NC30/NC35/CB1300',
    'cbr250':   'Honda CBR150R/250RR/300',
    'cbr600':   'Honda CBR600RR/1000RR',
    'monkey':   'Honda Monkey/MSX125/DAX125',
    'nsr150':   'Honda NSR150SP/2T',
    'w650':     'Kawasaki W650/W800',
    'estrella': 'Kawasaki Estrella250/TR250',
    'ksr':      'Kawasaki KSR110/KR150',
    'ninja250': 'Kawasaki Ninja250/300/400',
    'zx10':     'Kawasaki ZX-10RR',
    'tempter':  'Suzuki Tempter400',
    'volty':    'Suzuki Volty250',
    'thruxton': 'Triumph Thruxton/T100/T120',
    'daytona675': 'Triumph Daytona675',
    's1000rr':  'BMW S1000RR',
    'interceptor': 'Royal Enfield GT535/Interceptor650',
    'monster':  'Ducati Monster795/796',
    'panigale': 'Ducati Panigale V4R',
    'hd883':    'Harley-Davidson Sportster883-1200',
    'centaur':  'Stallions Centaur150',
    'rc390':    'KTM RC390',
}

REMOVE_SUFFIX = re.compile(
    r'\s*(ผลิตจาก|ทำจาก|made from|Material:)[^\n]{0,200}$'
    r'|\s*(อันละ|ชุดละ|ชิ้นละ|คู่ละ|ต่ออัน|ราคาต่ออัน|\(ราคาต่ออัน\))\s*$',
    re.IGNORECASE
)

def clean_material(mat):
    mat = mat.strip()
    mat = re.sub(r'\s*(ทั้ง|ชิ้น|ตัว|อัน|ด้วย)\s*$', '', mat).strip('. ')
    return mat or ''

def clean_core(desc):
    cleaned = REMOVE_SUFFIX.sub('', desc).strip('. ')
    return cleaned if cleaned else desc.strip()

def make_descriptions(name, nameTh, desc_raw, mat_raw, bikes, price):
    mat = clean_material(mat_raw)
    core = clean_core(desc_raw) if desc_raw else name
    if not core or len(core) < 8:
        core = name

    bikes_str = ' · '.join(BIKE_NAMES.get(b, b) for b in bikes) if bikes else ''

    # EN description
    en_parts = [core]
    if bikes_str:
        en_parts.append('Fits: ' + bikes_str)
    en_parts.append('Material: ' + mat if mat else 'Material: CNC Billet Alloy 6061 T6')
    en_parts.append('Designed & machined by GIGA BIKE FACTORY, Thailand.')
    new_en = en_parts[0] + '. ' + ' · '.join(en_parts[1:])

    # TH description
    th_parts = [core]
    if bikes_str:
        th_parts.append('ใส่ได้กับ ' + bikes_str)
    th_parts.append('วัสดุ ' + mat if mat else 'วัสดุ CNC Billet Alloy 6061 T6')
    th_parts.append('ออกแบบและผลิตโดย GIGA BIKE FACTORY ประเทศไทย')
    new_th = ' · '.join(th_parts)

    return new_en, new_th

def escape_json(s):
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    return s

FILE = r'thaigigabike/src/data/products.generated.ts'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

product_pat = re.compile(r'(\{[^{}]*?"id"\s*:\s*"[^"]+?"[^{}]*?\})', re.DOTALL)

updated = 0
errors  = 0

def process_block(m):
    global updated, errors
    block = m.group(1)
    try:
        def get_str(key):
            r = re.search(r'"' + key + r'"\s*:\s*"((?:[^"\\]|\\.)*)"', block)
            return r.group(1) if r else ''
        def get_int(key):
            r = re.search(r'"' + key + r'"\s*:\s*(\d+)', block)
            return int(r.group(1)) if r else 0
        def get_list(key):
            r = re.search(r'"' + key + r'"\s*:\s*\[([^\]]*)\]', block, re.DOTALL)
            if not r: return []
            return re.findall(r'"([^"]+)"', r.group(1))

        pid    = get_str('id')
        name   = get_str('name')
        nameTh = get_str('nameTh')
        desc   = get_str('description')
        mat    = get_str('material')
        bikes  = get_list('bikeModels')
        price  = get_int('price')

        if not pid or not name:
            return block

        new_en, new_th = make_descriptions(name, nameTh, desc, mat, bikes, price)

        new_block = re.sub(
            r'"description"\s*:\s*"(?:[^"\\]|\\.)*"',
            '"description": "' + escape_json(new_en) + '"',
            block
        )
        new_block = re.sub(
            r'"descriptionTh"\s*:\s*"(?:[^"\\]|\\.)*"',
            '"descriptionTh": "' + escape_json(new_th) + '"',
            new_block
        )

        if new_block != block:
            updated += 1
        return new_block
    except Exception as e:
        errors += 1
        return block

new_content = product_pat.sub(process_block, content)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Updated: {updated} products')
print(f'Errors:  {errors}')

# Spot-check
def spot(pid):
    m = re.search(r'"id": "' + pid + r'"[^}]*?"descriptionTh": "([^"]{0,250})"', new_content, re.DOTALL)
    if m:
        print(f'  [{pid}] TH: {m.group(1)[:200]}')

spot('cb1')
spot('cb2')
spot('cb3')
