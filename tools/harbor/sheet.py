"""Join pv_<name>_{front,q34,top}.png into one row per model: python sheet.py <dir> <out.png> name,name"""
import sys, os
from PIL import Image, ImageDraw
d, out, names = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
ims = [[Image.open(os.path.join(d, "pv_%s_%s.png" % (n, v))) for v in ("front", "q34", "top")] for n in names]
w, h = ims[0][0].size
sheet = Image.new("RGB", (w * 3, (h + 24) * len(names)), "white")
dr = ImageDraw.Draw(sheet)
for r, (n, row) in enumerate(zip(names, ims)):
    dr.text((8, r * (h + 24) + 6), n + "   (front / 3-4 / top)", fill="black")
    for c, im in enumerate(row):
        sheet.paste(im.convert("RGB"), (c * w, r * (h + 24) + 24))
sheet.save(out)
