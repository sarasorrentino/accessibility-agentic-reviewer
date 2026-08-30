import { useRef, useState, type ReactNode } from 'react';

import { Button } from '../components/Button';
import { ButtonLegacy } from '../components/ButtonLegacy';
import { IconButton } from '../components/IconButton';
import { IconButtonLegacy } from '../components/IconButtonLegacy';
import { FormField } from '../components/FormField';
import { FormFieldLegacy } from '../components/FormFieldLegacy';
import { Modal } from '../components/Modal';
import { ModalLegacy } from '../components/ModalLegacy';
import { ToastProvider, useToast } from '../components/Toast';
import { ToastLegacy } from '../components/ToastLegacy';
import { Dropdown } from '../components/Dropdown';
import { DropdownLegacy } from '../components/DropdownLegacy';
import { SortableList } from '../components/SortableList';
import { SortableListLegacy } from '../components/SortableListLegacy';
import { Card } from '../components/Card';
import { CardLegacy } from '../components/CardLegacy';
import { IconTrash } from '../components/icons';

/** A conforming / violating pair, with what to try and what should happen. */
function Pair({
  title,
  criteria,
  tryThis,
  good,
  bad,
}: {
  title: string;
  criteria: string;
  tryThis: string;
  good: ReactNode;
  bad: ReactNode;
}) {
  return (
    <section className="pair">
      <header>
        <h2>{title}</h2>
        <p className="criteria">{criteria}</p>
        <p className="try">
          <strong>Try this:</strong> {tryThis}
        </p>
      </header>
      <div className="pair__grid">
        <div className="panel panel--good">
          <h3>✅ Conforming</h3>
          <div className="stage">{good}</div>
        </div>
        <div className="panel panel--bad">
          <h3>❌ Violating</h3>
          <div className="stage">{bad}</div>
        </div>
      </div>
    </section>
  );
}

const OPTIONS = [
  { value: 'raw', label: 'Raw materials' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'cooling', label: 'Cooling (disabled)', disabled: true },
  { value: 'storage', label: 'Storage' },
];

function ToastDemo() {
  const showToast = useToast();
  return (
    <Button onClick={() => showToast({ message: 'Record saved', kind: 'success' })}>
      Save (announces politely)
    </Button>
  );
}

export function App() {
  const [email, setEmail] = useState('');
  const [emailBad, setEmailBad] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBadOpen, setModalBadOpen] = useState(false);
  const [legacyToast, setLegacyToast] = useState<string | null>(null);
  const modalTrigger = useRef<HTMLButtonElement>(null);

  const [items, setItems] = useState([
    { id: '1', label: 'Receiving' },
    { id: '2', label: 'Storage' },
    { id: '3', label: 'Preparation' },
  ]);
  const move = (id: string, dir: -1 | 1) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const reorder = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  return (
    <ToastProvider>
      <main>
        <h1>Accessibility fixture</h1>
        <p className="lede">
          Eight component pairs. The left column uses the design tokens and passes
          WCAG 2.1/2.2 AA; the right column contains deliberate violations, and is
          what the review agent is evaluated against.
        </p>
        <p className="lede">
          <strong>Put the mouse away.</strong> Most of these defects are invisible
          until you navigate with <kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>{' '}
          and the arrow keys — which is the point.
        </p>

        <Pair
          title="Button — activation and focus"
          criteria="WCAG 2.5.2 (A) pointer cancellation · 2.1.1 (A) keyboard · 2.4.7 (AA) focus visible"
          tryThis="Tab to each button and press Enter. The right one never fires — it listens for onPointerDown, which the keyboard never sends. Its focus ring is also removed."
          good={<Button onClick={() => alert('Activated')}>Confirm</Button>}
          bad={<ButtonLegacy onPress={() => alert('Activated')}>Confirm</ButtonLegacy>}
        />

        <Pair
          title="Icon button — accessible name and target size"
          criteria="WCAG 4.1.2 (A) name/role/value · 2.5.8 (AA) target size"
          tryThis="Compare the hit areas: 44px vs 16px. With a screen reader, the right one announces only “button” — its icon is aria-hidden and there is no label."
          good={
            <IconButton icon={<IconTrash />} ariaLabel="Delete record" onClick={() => alert('Deleted')} />
          }
          bad={<IconButtonLegacy onClick={() => alert('Deleted')} />}
        />

        <Pair
          title="Form field — label, error, autocomplete"
          criteria="WCAG 3.3.2 (A) labels · 3.3.1 (A) error identification · 1.3.5 (AA) input purpose"
          tryThis="Type into both, then clear them. On the right the field's identity disappears with the placeholder, the error is never linked to the input, and autofill cannot work."
          good={
            <FormField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              error={email && !email.includes('@') ? 'Enter a valid email address' : undefined}
            />
          }
          bad={
            <FormFieldLegacy
              value={emailBad}
              onChange={setEmailBad}
              error={emailBad && !emailBad.includes('@') ? 'Enter a valid email address' : undefined}
            />
          }
        />

        <Pair
          title="Modal — focus trap with an exit"
          criteria="WCAG 2.1.2 (A) no keyboard trap · 4.1.2 (A) dialog role · 1.4.10 (AA) reflow"
          tryThis="Open each and press Escape, then Tab repeatedly. The left closes and returns focus to its trigger. The right traps you on the first control with no way out — reload the page to escape."
          good={
            <>
              <Button onClick={() => setModalOpen(true)}>Open dialog</Button>
              <span ref={modalTrigger as never} />
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirm deletion"
                triggerRef={modalTrigger as React.RefObject<HTMLElement>}
              >
                <p>This action cannot be undone.</p>
                <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              </Modal>
            </>
          }
          bad={
            <>
              <ButtonLegacy onPress={() => setModalBadOpen(true)}>Open dialog</ButtonLegacy>
              <button type="button" className="btn btn--secondary" onClick={() => setModalBadOpen(true)}>
                Open dialog (keyboard-reachable trigger)
              </button>
              <ModalLegacy isOpen={modalBadOpen} title="Confirm deletion">
                <p>This action cannot be undone.</p>
                <button type="button" className="btn btn--secondary" onClick={() => setModalBadOpen(false)}>
                  Cancel
                </button>
              </ModalLegacy>
            </>
          }
        />

        <Pair
          title="Toast — live region announcement"
          criteria="WCAG 4.1.3 (AA) status messages"
          tryThis="With a screen reader on, trigger both. The left announces because its live region was already in the DOM; the right mounts the region together with its text, so the announcement is usually dropped."
          good={<ToastDemo />}
          bad={
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setLegacyToast(null);
                  setTimeout(() => setLegacyToast('Record saved'), 10);
                }}
              >
                Save (may announce nothing)
              </button>
              <ToastLegacy message={legacyToast} />
            </>
          }
        />

        <Pair
          title="Dropdown — ARIA pattern and keymap"
          criteria="WCAG 2.1.1 (A) keyboard · 2.4.3 (A) focus order · 4.1.2 (A) name/role/value"
          tryThis="Tab to each, then press Enter and the arrow keys. The right declares role=&quot;listbox&quot; but implements none of the keymap it promises, and its tabIndex={1} hijacks the page's focus order."
          good={<Dropdown label="Process stage" options={OPTIONS} value={choice} onChange={setChoice} />}
          bad={<DropdownLegacy options={OPTIONS} onChange={() => {}} />}
        />

        <Pair
          title="Sortable list — drag alternative"
          criteria="WCAG 2.5.1 (A) pointer gestures · 2.1.1 (A) keyboard"
          tryThis="Reorder both using only the keyboard. The left exposes move up/down buttons; the right is drag-only and cannot be reordered at all without a pointer."
          good={
            <SortableList
              items={items}
              onMoveUp={(id) => move(id, -1)}
              onMoveDown={(id) => move(id, 1)}
              onReorder={reorder}
            />
          }
          bad={<SortableListLegacy items={items} onReorder={reorder} />}
        />

        <Pair
          title="Card — clickable region and contrast"
          criteria="WCAG 2.1.1 (A) keyboard · 4.1.2 (A) role · 1.4.3 (AA) contrast"
          tryThis="Tab through both. The right card is never reachable — it is a div with onClick, invisible to keyboard and screen readers — and its body text uses the disabled-only colour at roughly 2.5:1."
          good={
            <Card title="Batch 1042" onSelect={() => alert('Selected')}>
              <p>Received 08:15 · temperature within range</p>
            </Card>
          }
          bad={
            <CardLegacy title="Batch 1042" onSelect={() => alert('Selected')}>
              Received 08:15 · temperature within range
            </CardLegacy>
          }
        />
      </main>
    </ToastProvider>
  );
}
