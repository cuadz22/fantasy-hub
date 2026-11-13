import os,re,json,base64,sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
def dec(s):
    b=re.search(r"var CM_BLOB='([^']+)'",s).group(1); raw=base64.b64decode(b)
    key=PBKDF2HMAC(hashes.SHA256(),32,raw[:16],300000).derive(os.environ['CFN_COMMISH_PIN'].encode())
    return json.loads(AESGCM(key).decrypt(raw[16:28],raw[28:],None))
if __name__=='__main__':
    C=dec(open(sys.argv[1]).read()); json.dump(C,open(sys.argv[2],'w'))
    print(C['upd'],len(C['players']))
