'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadButton from '@/components/DownloadButton';
import ToolLayout from '@/components/ToolLayout';

/**
 * QR codes and barcodes.
 *
 * Both draw locally, which matters more here than on most tools: the usual QR
 * sites hand back an image hosted on their own domain, so a poster or a menu
 * carries a live dependency on a company that may not exist next year, and a
 * dead QR code on a printed sign cannot be fixed. What comes out of here is a
 * file.
 *
 * SVG is offered alongside PNG because a QR code on anything printed wants to
 * be vector. A 300px PNG blown up to a poster is the other common way these
 * end up unscannable.
 *
 * The presets exist because a wifi QR code is not free text: it is a specific
 * string format, and getting a semicolon wrong produces a code that scans and
 * then does nothing.
 */

type Kind = 'qr' | 'barcode';

type Preset = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard';

const BARCODE_FORMATS: { id: string; label: string; hint: string }[] = [
  { id: 'CODE128', label: 'Code 128', hint: 'The general purpose one. Any characters, any length.' },
  { id: 'EAN13', label: 'EAN-13', hint: 'Retail products. Exactly 12 digits, the 13th is worked out.' },
  { id: 'EAN8', label: 'EAN-8', hint: 'Small retail packaging. 7 digits.' },
  { id: 'UPC', label: 'UPC-A', hint: 'Retail in North America. 11 digits.' },
  { id: 'CODE39', label: 'Code 39', hint: 'Older industrial and military. Capitals and digits.' },
  { id: 'ITF14', label: 'ITF-14', hint: 'Shipping cartons. 13 digits.' },
  { id: 'MSI', label: 'MSI', hint: 'Warehouse shelving. Digits only.' },
  { id: 'pharmacode', label: 'Pharmacode', hint: 'Pharmaceutical packaging. A number from 3 to 131070.' },
  { id: 'codabar', label: 'Codabar', hint: 'Blood banks and libraries.' },
];

function escapeWifi(value: string): string {
  // Semicolons, commas, colons and backslashes are separators in the wifi
  // string, so a password containing one has to be escaped or the code scans
  // and silently joins nothing.
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export default function CodeGenerator({ kind }: { kind: Kind }) {
  /* Shared */
  const [error, setError] = useState<string | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [svgText, setSvgText] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* QR */
  const [preset, setPreset] = useState<Preset>('text');
  const [text, setText] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [hidden, setHidden] = useState(false);
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [dark, setDark] = useState('#101010');
  const [light, setLight] = useState('#ffffff');

  /* Barcode */
  const [format, setFormat] = useState('CODE128');
  const [value, setValue] = useState('');
  const [showText, setShowText] = useState(true);

  const payload = useCallback((): string => {
    switch (preset) {
      case 'url':
        return text.trim() && !/^https?:\/\//i.test(text.trim())
          ? `https://${text.trim()}`
          : text.trim();
      case 'wifi':
        return ssid
          ? `WIFI:T:${encryption};S:${escapeWifi(ssid)};${
              encryption === 'nopass' ? '' : `P:${escapeWifi(password)};`
            }${hidden ? 'H:true;' : ''};`
          : '';
      case 'email':
        return text.trim() ? `mailto:${text.trim()}` : '';
      case 'phone':
        return text.trim() ? `tel:${text.trim()}` : '';
      case 'sms':
        return text.trim() ? `smsto:${text.trim()}` : '';
      case 'vcard': {
        const [name, phone, email] = text.split('\n');
        if (!name?.trim()) return '';
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name.trim()}\n${
          phone?.trim() ? `TEL:${phone.trim()}\n` : ''
        }${email?.trim() ? `EMAIL:${email.trim()}\n` : ''}END:VCARD`;
      }
      default:
        return text;
    }
  }, [preset, text, ssid, password, encryption, hidden]);

  const draw = useCallback(async () => {
    setError(null);
    setPngUrl(null);
    setSvgText(null);

    if (kind === 'qr') {
      const data = payload();
      if (!data.trim()) return;
      try {
        const QRCode = (await import('qrcode')).default;
        const options = {
          width: size,
          margin,
          errorCorrectionLevel: level,
          color: { dark, light },
        };
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, data, options);
          setPngUrl(canvasRef.current.toDataURL('image/png'));
        }
        setSvgText(await QRCode.toString(data, { ...options, type: 'svg' }));
      } catch (e) {
        setError(
          e instanceof Error && /too long|big/i.test(e.message)
            ? 'That is more than a QR code can hold. Shorten it, or drop the error correction to L.'
            : 'That could not be turned into a QR code.',
        );
      }
      return;
    }

    if (!value.trim()) return;
    try {
      const JsBarcode = (await import('jsbarcode')).default;
      // Drawn into a detached SVG so a failure never leaves a half drawn
      // barcode on the page.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, value.trim(), {
        format,
        displayValue: showText,
        lineColor: dark,
        background: light,
        margin: 10,
        valid: (ok: boolean) => {
          if (!ok) throw new Error('invalid');
        },
      });
      const markup = new XMLSerializer().serializeToString(svg);
      setSvgText(markup);
      if (svgRef.current) svgRef.current.replaceWith(svg.cloneNode(true));

      // A PNG as well, since most people want to paste it somewhere.
      const img = new Image();
      const blob = new Blob([markup], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPngUrl(canvas.toDataURL('image/png'));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      const hint = BARCODE_FORMATS.find((f) => f.id === format)?.hint ?? '';
      setError(`That is not valid for this barcode type. ${hint}`);
    }
  }, [kind, payload, size, margin, level, dark, light, value, format, showText]);

  useEffect(() => {
    void draw();
  }, [draw]);

  const label = 'text-xs font-semibold uppercase tracking-wider text-ink-faint';
  const field =
    'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent';

  return (
    <ToolLayout
      settings={
        <>
          {kind === 'qr' ? (
            <>
              <label className="block text-sm">
                <span className={label}>What it holds</span>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as Preset)}
                  className={field}
                >
                  <option value="text">Plain text</option>
                  <option value="url">A link</option>
                  <option value="wifi">Wifi network</option>
                  <option value="email">Email address</option>
                  <option value="phone">Phone number</option>
                  <option value="sms">Text message</option>
                  <option value="vcard">Contact card</option>
                </select>
              </label>

              {preset === 'wifi' ? (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className={label}>Network name</span>
                    <input value={ssid} onChange={(e) => setSsid(e.target.value)} className={field} />
                  </label>
                  <label className="block text-sm">
                    <span className={label}>Security</span>
                    <select
                      value={encryption}
                      onChange={(e) => setEncryption(e.target.value)}
                      className={field}
                    >
                      <option value="WPA">WPA or WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Open, no password</option>
                    </select>
                  </label>
                  {encryption !== 'nopass' && (
                    <label className="block text-sm">
                      <span className={label}>Password</span>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={field}
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      checked={hidden}
                      onChange={(e) => setHidden(e.target.checked)}
                      className="size-4 accent-[var(--accent)]"
                    />
                    Network name is hidden
                  </label>
                </div>
              ) : (
                <label className="block text-sm">
                  <span className={label}>
                    {preset === 'vcard' ? 'Name, phone, email, one per line' : 'Content'}
                  </span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={preset === 'vcard' ? 3 : 4}
                    placeholder={
                      preset === 'url'
                        ? 'vantly.xyz'
                        : preset === 'vcard'
                          ? 'Ada Lovelace\n+44 20 7946 0000\nada@example.com'
                          : ''
                    }
                    className={field + ' resize-y font-mono text-[13px]'}
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className={label}>Size</span>
                  <input
                    type="number"
                    min={128}
                    max={2048}
                    step={64}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value) || 512)}
                    className={field + ' tabular-nums'}
                  />
                </label>
                <label className="block text-sm">
                  <span className={label}>Quiet border</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className={field + ' tabular-nums'}
                  />
                </label>
              </div>

              <div>
                <span className={label}>Error correction</span>
                <div className="mt-2 inline-flex rounded-lg border border-line p-0.5 text-sm">
                  {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      aria-pressed={level === l}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${
                        level === l ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className={label}>Type</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className={field}
                >
                  {BARCODE_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-sm leading-relaxed text-ink-soft">
                  {BARCODE_FORMATS.find((f) => f.id === format)?.hint}
                </span>
              </label>

              <label className="block text-sm">
                <span className={label}>Value</span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={field + ' font-mono'}
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={showText}
                  onChange={(e) => setShowText(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                Print the number underneath
              </label>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className={label}>Ink</span>
              <input
                type="color"
                value={dark}
                onChange={(e) => setDark(e.target.value)}
                className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-line bg-surface"
              />
            </label>
            <label className="block text-sm">
              <span className={label}>Background</span>
              <input
                type="color"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-line bg-surface"
              />
            </label>
          </div>
        </>
      }
    >
        <span className={label}>Preview</span>
        <div className="mt-2 flex min-h-[18rem] items-center justify-center rounded-2xl border border-line bg-surface p-6">
          {error ? (
            <p className="max-w-sm text-center text-sm leading-relaxed text-accent">{error}</p>
          ) : kind === 'qr' ? (
            <canvas ref={canvasRef} className="max-h-[24rem] max-w-full" />
          ) : svgText ? (
            <div
              className="max-w-full [&>svg]:max-w-full"
              // The barcode is generated here, from the value typed on this
              // page, so there is no third party markup being trusted.
              dangerouslySetInnerHTML={{ __html: svgText }}
            />
          ) : (
            <p className="text-sm text-ink-faint">Type a value to see the barcode.</p>
          )}
        </div>

        {(pngUrl || svgText) && !error && (
          <div className="mt-4 flex flex-wrap gap-3">
            {pngUrl && (
              <DownloadButton href={pngUrl} filename={`${kind === 'qr' ? 'qr-code' : 'barcode'}.png`}>
                Download PNG
              </DownloadButton>
            )}
            {svgText && (
              <DownloadButton href={URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))} filename={`${kind === 'qr' ? 'qr-code' : 'barcode'}.svg`} variant="quiet">
                Download SVG
              </DownloadButton>
            )}
          </div>
        )}
    </ToolLayout>
  );
}
