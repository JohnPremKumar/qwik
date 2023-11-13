import { assert, suite, test } from 'vitest';
import type { JSXNode } from '../../jsx-runtime';
import { renderToString } from '../../server/render';
import { createDocument } from '../../testing/document';
import { createDOM } from '../../testing/library';
import { component$ } from '../component/component.public';
import { _fnSignal } from '../internal';
import { useSignal } from '../use/use-signal';

suite('jsx signals', () => {
  const RenderJSX = component$(() => {
    const jsx = useSignal<string | JSXNode>(<span>SSR</span>);
    return (
      <>
        <button class="text" onClick$={() => (jsx.value = 'text')} />
        <button class="i" onClick$={() => (jsx.value = <i>i</i>)} />
        <button class="b" onClick$={() => (jsx.value = <b>b</b>)} />
        <button class="virtual" onClick$={() => (jsx.value = <>v</>)} />
        <div class="jsx">{jsx.value}</div>
        <div class="jsx-signal">{_fnSignal((p0) => p0.value, [jsx], 'p0.value')}</div>
      </>
    );
  });

  test.skip('SSR jsx', async () => {
    const output = await renderToString(<RenderJSX />, { containerTagName: 'div' });
    const document = createDocument();
    document.body.innerHTML = output.html;
    const div = document.querySelector('.jsx')!;
    assert.equal(div.innerHTML, '<span>SSR</span>');
    const divSignal = document.querySelector('.jsx-signal')!;
    assert.equal(divSignal.innerHTML, '<!--t=1--><span>SSR</span><!---->');
  });

  test('CSR jsx', async () => {
    const { screen, render, userEvent } = await createDOM();

    await render(<RenderJSX />);
    const div = screen.querySelector('.jsx')!;
    const divSignal = screen.querySelector('.jsx-signal')!;
    assert.equal(div.innerHTML, '<span>SSR</span>');
    assert.equal(divSignal.innerHTML, '<span>SSR</span>');

    await userEvent('button.text', 'click');
    assert.equal(div.innerHTML, 'text');
    assert.equal(divSignal.innerHTML, 'text');

    await userEvent('button.i', 'click');
    assert.equal(div.innerHTML, '<i>i</i>');
    assert.equal(divSignal.innerHTML, '<i>i</i>');

    await userEvent('button.b', 'click');
    assert.equal(div.innerHTML, '<b>b</b>');
    assert.equal(divSignal.innerHTML, '<b>b</b>');

    await userEvent('button.virtual', 'click');
    assert.equal(div.innerHTML, 'v');
    assert.equal(divSignal.innerHTML, 'v');

    await userEvent('button.b', 'click');
    assert.equal(div.innerHTML, '<b>b</b>');
    assert.equal(divSignal.innerHTML, '<b>b</b>');

    await userEvent('button.text', 'click');
    assert.equal(div.innerHTML, 'text');
    assert.equal(divSignal.innerHTML, 'text');
  });

  //TODO(misko): More tests
  // - Render component
  // - Render promise
  // - Render array of JSX
});
