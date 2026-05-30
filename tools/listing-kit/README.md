# Listing Launch Kit Generator

This local tool creates the three files needed for one Listing Launch Kit:

- `listings/<property-slug>.html`
- `listings/<property-slug>-flyer.html`
- `images/qr-<property-slug>.png`

## Workflow

1. Copy `listing-sample.json`.
2. Rename it for the listing, for example `218-magnolia-lane.json`.
3. Fill in the address, agent info, public links, and image paths.
4. Run the generator.
5. Review the generated page and flyer locally.
6. Deploy only after approval.

## Command

From the website folder:

```powershell
python tools\listing-kit\generate_listing_kit.py tools\listing-kit\218-magnolia-lane.json
```

The script requires the Python package `qrcode[pil]`.

If it is missing:

```powershell
python -m pip install qrcode[pil]
```

## Notes

- Sample/demo kits should use `"sample": true`; generated pages will be `noindex`.
- Real client kits should use `"sample": false`; generated pages will be indexable unless you change the script.
- The QR code points to the future live URL by default:

```text
https://flyingacesmedia.com/listings/<property-slug>.html
```

Nothing is deployed by this generator. It only writes local files.
