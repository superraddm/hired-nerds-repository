# Glow Girls — garment generation brief

For producing new wardrobe layers with a browser image generator (ChatGPT and
similar) instead of the Codex CLI pipeline. Covers **tops, bottoms and shoes only**
— hair and accessories are excluded until Hana's and Jia's head shapes are settled,
because hair registers against the face opening.

## Files

| File | Use |
|---|---|
| `sol-model-1024x1536.png` | **Upload this one.** The master flattened onto flat grey `#7F7F7F`. |
| `sol-registration-guide.png` | Your reference for checking returns and for Photoshop. **Do not give it to the generator** — it will draw the annotation lines. |
| `registration.json` | The same measurements as data, for tooling. |
| `build-brief.py` | Regenerates all three from the live master. Re-run it whenever the master changes. |

The background matters. Extraction diffs the returned image against
`sol-model-1024x1536.png`, so an unchanged background is what isolates the garment.

## Registration

Canvas 1024×1536. Figure occupies x 299–719, y 63–1406. Every layer is composited
at (0, 0) with scale 1 — there is no per-item transform at runtime, so an item that
lands in the wrong place is wrong permanently.

| Landmark | y |
|---|---|
| Head crown | 63 |
| Chin / neck top | 200 |
| Shoulder line | 285 |
| Natural waist | 500 |
| Fingertips | 780 |
| Standing line (soles) | 1408 |

Centre line is x = 512.

| Zone | x | y | Notes |
|---|---|---|---|
| Top | 274–737 | 219–696 | cropped jackets; the tailcoat runs on to y=1216 |
| Bottom | 352–665 | 470–823 | waistband top 470–514, hem 707–823 |
| Shoes | 324–655 | 884–1408 | knee boots from 884, ankle boots from 1084 |

These are measured off the already-fitted layers, so they are ground truth rather
than targets someone chose.

## The prompt

Attach `sol-model-1024x1536.png`. Replace the bracketed line. One garment per
generation.

> Attached is a fixed character model on a 1024×1536 canvas. Return the **same
> image, at the same size**, with one garment added to the figure. This is a
> paper-doll layer for a game, so registration matters more than styling.
>
> **Draw:** [a cropped biker jacket in soft lilac patent leather, open at the front,
> silver hardware, long sleeves ending at the wrist]
>
> **Do not change anything else.** Specifically:
> - Do not move, resize, rotate, re-pose or re-proportion the figure. Head, face,
>   shoulders, hands and feet must stay on exactly the same pixels.
> - Do not crop, zoom, pan or change the aspect ratio. Output 1024×1536.
> - Keep the flat grey background exactly as it is. No scene, no gradient, no shadow
>   cast onto the background, no vignette.
> - Do not add hair, headwear, jewellery, or any second garment. One item only.
> - Do not restyle or "improve" the body, the face or the black bodysuit where the
>   new garment does not cover them.
>
> **Fit rules:**
> - Front-facing, symmetrical, flat even studio lighting, no dramatic shadows.
> - Sleeves must be complete and the hands must stay fully visible in front of them.
> - Waistbands sit at the natural waist. Shoe soles sit flat on the ground the figure
>   is already standing on — do not lift or tilt the feet.
> - Photoreal rendering matching the model's existing style. Original design — do not
>   copy any real brand, logo or existing character's costume.

## Working rules

**Re-upload the original model for every garment.** Building on the previous output
compounds drift, and by the fourth item you have a different mannequin. That is
exactly how the v1 sheets failed — see `FABLE-HANDOFF.md`.

**One item per message.** Asking for a sheet of four returns four independently
drifted figures.

**Check the face and hands before sending anything on.** Open the return over
`sol-model-1024x1536.png` in Photoshop. If the face and hands land on the same
pixels, the garment registers almost for free. If they have moved, the item needs
the full anchor pipeline and costs roughly what the Sol set did.

## Reject a return if

- the figure has moved, changed size, or been re-posed
- the canvas is not 1024×1536, or the image has been cropped or zoomed
- the background is no longer flat grey
- hands are hidden inside sleeves, or feet have lifted off the standing line
- more than one garment appeared, or hair or jewellery was added
- the body or face was repainted where the garment does not cover it
