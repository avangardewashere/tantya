/**
 * B1-T9 · the form computes and shows its working ·
 * B1-T10 · it refuses bad input out loud, and never renders a NaN.
 *
 * The frozen test table is passed in, so these expectations are the ones
 * worked by hand in docs/worked-examples.md and cannot drift when a real
 * factor is corrected later.
 */
import type React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { FROZEN_TEST_FACTORS } from '@/engine/__fixtures__/frozen-factors'
import { WorkItemForm } from '../work-item-form'

/**
 * Rendered inside a <main>, because that is where the app puts it. Without a
 * landmark, axe's "region" rule fails on content that is perfectly fine in
 * the real page — so leaving it out would mean testing a page that does not
 * exist.
 */
const inMain = (ui: React.ReactElement) => render(<main>{ui}</main>)

const renderForm = () => {
  const user = userEvent.setup()
  inMain(<WorkItemForm factors={FROZEN_TEST_FACTORS} />)
  return user
}

const typeInto = async (
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  text: string,
) => {
  const input = screen.getByLabelText(label)
  await user.clear(input)
  await user.type(input, text)
}

/** The row for a material, so assertions read like the screen does. */
const row = (name: RegExp) => screen.getByRole('row', { name })

describe('B1-T9 the wall calculator on screen', () => {
  it('turns 3 and 2.7 at 150 mm into 102 pcs', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await user.selectOptions(screen.getByLabelText(/block thickness/i), '150')

    expect(await screen.findByText('102 pcs')).toBeInTheDocument()
    expect(within(row(/CHB 150/)).getByText('102 pcs')).toBeInTheDocument()
  })

  it('takes the door off, and the answer falls to 78 pcs', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    expect(await screen.findByText('102 pcs')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add an opening/i }))
    await typeInto(user, /width of opening 1/i, '0.9')
    await typeInto(user, /height of opening 1/i, '2.1')

    expect(await screen.findByText('78 pcs')).toBeInTheDocument()
    expect(screen.queryByText('102 pcs')).not.toBeInTheDocument()
  })

  it('shows the working, so the number can be checked at the counter', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')

    expect(await screen.findByText('8.1 m² × 12.5 pcs/m² = 101.25')).toBeInTheDocument()
    // The exact need is shown alongside what to buy: 101.25 blocks needed,
    // 102 bought. Both matter, and for different reasons.
    expect(screen.getByText(/needs 101\.25/)).toBeInTheDocument()
  })

  it('marks the factor nobody has checked, and only that one', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await screen.findByText('102 pcs')

    // Mortar sand at 150 mm class A is unverified in the frozen table on
    // purpose. Cement and the blocks are not.
    expect(within(row(/Sand/)).getByText('unverified')).toBeInTheDocument()
    expect(within(row(/CHB 150/)).queryByText('unverified')).not.toBeInTheDocument()
    expect(within(row(/Cement/)).queryByText('unverified')).not.toBeInTheDocument()
  })

  it('follows the thickness to a different block, with the same count', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await screen.findByText('102 pcs')

    await user.selectOptions(screen.getByLabelText(/block thickness/i), '200')

    expect(await screen.findByRole('row', { name: /CHB 200/ })).toBeInTheDocument()
    expect(within(row(/CHB 200/)).getByText('102 pcs')).toBeInTheDocument()
    // The mortar moves even though the block count does not.
    expect(within(row(/Cement/)).getByText('11 bags')).toBeInTheDocument()
  })
})

describe('B1-T9 the concrete calculator on screen', () => {
  it('turns six 1 × 1 × 0.25 m footings into 14 bags', async () => {
    const user = renderForm()

    await user.click(screen.getByRole('radio', { name: /concrete/i }))
    await user.selectOptions(screen.getByLabelText(/what is it/i), 'footing')
    await typeInto(user, /^length/i, '1')
    await typeInto(user, /^width/i, '1')
    await typeInto(user, /^depth/i, '0.25')
    await typeInto(user, /how many/i, '6')

    expect(await screen.findByText('14 bags')).toBeInTheDocument()
    expect(within(row(/Sand/)).getByText('1.0 m³')).toBeInTheDocument()
    expect(within(row(/Gravel/)).getByText('1.5 m³')).toBeInTheDocument()
  })

  it('keeps the float trap shut on the way through the form', async () => {
    const user = renderForm()

    await user.click(screen.getByRole('radio', { name: /concrete/i }))
    await typeInto(user, /^length/i, '10')
    await typeInto(user, /^width/i, '10')
    await typeInto(user, /^depth/i, '0.07')

    // 63, not 64. This is the whole project, on screen.
    expect(await screen.findByText('63 bags')).toBeInTheDocument()
    expect(screen.queryByText('64 bags')).not.toBeInTheDocument()
  })

  it('remembers the wall when you switch away and back', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await screen.findByText('102 pcs')

    await user.click(screen.getByRole('radio', { name: /concrete/i }))
    await user.click(screen.getByRole('radio', { name: /hollow-block wall/i }))

    expect(await screen.findByText('102 pcs')).toBeInTheDocument()
  })
})

describe('B1-T10 bad input is refused out loud', () => {
  it('shows an inline alert when a measurement cannot be read', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2,7')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/full stop for the decimal/i)
    // And nothing is computed from a value nobody meant.
    expect(screen.queryByText(/pcs$/)).not.toBeInTheDocument()
  })

  it('ties the alert to the field that caused it', async () => {
    const user = renderForm()

    await typeInto(user, /^height/i, '10ft')

    const input = screen.getByLabelText(/^height/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/metres/i)
  })

  it('clearing a filled field takes the answer away rather than guessing', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    expect(await screen.findByText('102 pcs')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/^height/i))

    expect(screen.queryByText('102 pcs')).not.toBeInTheDocument()
    expect(screen.getByText(/fill in every measurement/i)).toBeInTheDocument()
  })

  it('says the openings are bigger than the wall, in an alert', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await user.click(screen.getByRole('button', { name: /add an opening/i }))
    await typeInto(user, /width of opening 1/i, '4')
    await typeInto(user, /height of opening 1/i, '3')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /openings add up to more than the wall/i,
    )
  })

  test.each(['abc', '2.7005', '0', '-1', '1e3', '3m'])(
    'never renders NaN or Infinity for %p',
    async (bad) => {
      const user = renderForm()

      await typeInto(user, /^length/i, bad)
      await typeInto(user, /^height/i, '2.7')

      expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
    },
  )
})

describe('B1-T10 the form is usable without a mouse or a screen', () => {
  it('tells the wall height apart from an opening height', async () => {
    const user = renderForm()
    await user.click(screen.getByRole('button', { name: /add an opening/i }))

    // Both are called "Height" on screen, which is right — the layout says
    // which is which. Someone listening to the page has no layout, so the
    // accessible names differ.
    expect(screen.getByLabelText(/^height \(m\)$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/height of opening 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove opening 1/i })).toBeInTheDocument()
  })

  it('labels every input and asks Android for the number keypad', () => {
    inMain(<WorkItemForm factors={FROZEN_TEST_FACTORS} />)

    for (const label of [/^length/i, /^height/i]) {
      expect(screen.getByLabelText(label)).toHaveAttribute('inputMode', 'decimal')
    }
    expect(screen.getByLabelText(/block thickness/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mortar class/i)).toBeInTheDocument()
  })

  it('uses text inputs, not number inputs, so a refusal can be explained', () => {
    inMain(<WorkItemForm factors={FROZEN_TEST_FACTORS} />)

    // A number input silently drops what it cannot parse, which would make
    // "2,7" disappear instead of being answered.
    expect(screen.getByLabelText(/^length/i)).toHaveAttribute('type', 'text')
  })

  it('has no accessibility violations jest-axe can see, empty', async () => {
    const { container } = inMain(<WorkItemForm factors={FROZEN_TEST_FACTORS} />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has none with results on screen either', async () => {
    const user = renderForm()

    await typeInto(user, /^length/i, '3')
    await typeInto(user, /^height/i, '2.7')
    await screen.findByText('102 pcs')

    expect(await axe(document.body)).toHaveNoViolations()
  })
})
