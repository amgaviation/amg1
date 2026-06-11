from PIL import Image

src = Image.open("public/images/logo-original.png").convert("RGBA")
px = src.load()
w, h = src.size

def make_variant(rgb, out_path):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # luminance: white bg ~ bright, logo mark ~ dark gray
            lum = (r + g + b) / 3
            if lum > 230:
                # background -> transparent
                op[x, y] = (0, 0, 0, 0)
            else:
                # logo pixel -> recolor, alpha from darkness for smooth edges
                alpha = int(min(255, (255 - lum) / 255 * 255 * 1.15))
                op[x, y] = (rgb[0], rgb[1], rgb[2], alpha)
    # crop to content bbox
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(out_path)
    print("saved", out_path, img.size)

make_variant((255, 255, 255), "public/images/logo-white.png")
make_variant((5, 11, 20), "public/images/logo-navy.png")
make_variant((59, 130, 246), "public/images/logo-blue.png")
