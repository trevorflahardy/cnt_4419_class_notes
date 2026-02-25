# CNT 4419: Secure Coding — Class Notes

Typed lecture notes for **CNT 4419: Secure Coding** at the University of South Florida (Spring 2026).

Written in [Typst](https://typst.app/).

## 📄 Download the PDF

The latest PDF is automatically built from the source on every push and attached to a GitHub Release:

**[⬇ Download Latest PDF](https://github.com/trevorflahardy/cnt_4419_class_notes/releases/latest/download/cnt_4419_typed_notes.pdf)**

## Building Locally

If you want to compile the notes yourself, install [Typst](https://github.com/typst/typst) and run:

```bash
typst compile cnt_4419_typed_notes.typ
```

## CI/CD

A [GitHub Actions workflow](.github/workflows/build-pdf.yml) runs on every push to `master` that modifies a `.typ` file. It:

1. Installs Typst via [`typst-community/setup-typst`](https://github.com/typst-community/setup-typst)
2. Compiles the notes to PDF
3. Uploads the PDF as a workflow artifact
4. Updates the `latest` GitHub Release with the new PDF
