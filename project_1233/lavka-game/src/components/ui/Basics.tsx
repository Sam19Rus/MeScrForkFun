/* Basics.tsx — кнопки, бейджи, модалка, тосты, лицо (SVG из строки). */
import React from 'react';
import type { Toast } from '../../game/types';

export function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'secondary' | 'danger';
  big?: boolean; small?: boolean;
}) {
  const { variant = 'primary', big, small, className = '', children, ...rest } = props;
  const cls = ['btn', variant !== 'primary' ? variant : '', big ? 'big' : '', small ? 'small' : '', className].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}

export function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function Modal({ onClose, children, wide }: { onClose?: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="modal" style={wide ? { maxWidth: 'min(760px, 96vw)' } : undefined}>{children}</div>
    </div>
  );
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts">
      {toasts.map(t => <div className="toast-msg" key={t.id}>{t.msg}</div>)}
    </div>
  );
}

/** лицо из SVG-строки (FACES) */
export function Face({ svg, size = 48, className = '' }: { svg: string; size?: number; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

/** произвольный SVG из строки */
export function SvgRaw({ svg, className, style }: { svg: string; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={style ? { ...style, lineHeight: 0 } : { lineHeight: 0 }}
    dangerouslySetInnerHTML={{ __html: svg }} />;
}
