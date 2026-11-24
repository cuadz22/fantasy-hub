"""Explicit, read-only generation; no deployment, email, push or publishing actions."""
import argparse,pathlib,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--season',type=int,required=True);p.add_argument('--week',type=int,required=True);p.add_argument('--output',required=True);a=p.parse_args()
tools=pathlib.Path(__file__).resolve().parent;workspace=tools.parents[1];root=pathlib.Path(a.output).resolve()
steps=[[sys.executable,str(tools/'fetch.py'),'--season',str(a.season),'--week',str(a.week),'--output',str(root)],['node',str(tools/'yahoo.mjs'),str(root)],[sys.executable,str(tools/'prepare.py'),str(root)],[sys.executable,str(tools/'build.py'),str(root)],['node',str(tools/'render.cjs'),str(root)],[sys.executable,str(tools/'gallery.py'),str(root)]]
for step in steps:subprocess.run(step,cwd=workspace,check=True)
print('Ready for human review:',root/'studio-preview.html')
