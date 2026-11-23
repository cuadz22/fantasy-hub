"""Local redesign preview: serves the candidate and proxies only public GET feeds.
No secrets, auth endpoints, mutations, cron triggers, or production deployment.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import urllib.request, urllib.error, threading, time, json
ROOT = Path(__file__).resolve().parents[2] / 'client/public'
CACHE, LOCK, KEY_LOCKS = {}, threading.Lock(), {}
ALLOWED = {'/api/mobile/power': 60, '/api/trades': 60, '/api/mobile/context': 300, '/api/mobile/media': 3600, '/api/mobile/standings': 300, '/api/lineups': 60, '/api/mobile/market-movers': 900}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def do_GET(self):
        u=urlparse(self.path)
        if u.path.startswith('/api/'):
            q=parse_qs(u.query)
            if u.path not in ALLOWED or any(k not in ('lg','week') for k in q) or ('lg' in q and q['lg'] not in [['gl'],['bh'],['rb'],['sts']]) or ('week' in q and (len(q['week'])!=1 or not q['week'][0].isdigit() or not 1<=int(q['week'][0])<=18)):
                self.send_error(403);return
            try:
                with LOCK:
                    key_lock=KEY_LOCKS.setdefault(self.path,threading.Lock())
                with key_lock:
                    item=CACHE.get(self.path)
                    if not item or time.time()-item[0]>ALLOWED[u.path]:
                        with urllib.request.urlopen('https://cuadzfantasynetwork.com'+self.path,timeout=20) as r: data=r.read()
                        json.loads(data); item=(time.time(),data);CACHE[self.path]=item
                self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(item[1])
            except Exception:
                self.send_error(503,'Public feed unavailable')
            return
        super().do_GET()
    def do_POST(self): self.send_error(405)
    do_PUT=do_POST;do_DELETE=do_POST;do_PATCH=do_POST
class PreviewServer(ThreadingHTTPServer):
    request_queue_size=128
if __name__=='__main__': PreviewServer(('127.0.0.1',8770),Handler).serve_forever()
