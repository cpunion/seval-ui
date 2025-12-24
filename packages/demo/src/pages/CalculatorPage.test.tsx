import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculatorPage } from './CalculatorPage'

function renderCalculator() {
  render(<CalculatorPage />)
}

async function findDisplayHeading(value: string) {
  const headings = await screen.findAllByRole('heading', { level: 1, name: value })
  return headings[headings.length - 1]
}

describe('CalculatorPage', () => {
  it('renders the calculator surface with the initial value', async () => {
    renderCalculator()

    await waitFor(async () => {
      expect(await findDisplayHeading('0')).toBeInTheDocument()
    })
  })

  it('performs a simple 5 + 3 = 8 calculation through the UI', async () => {
    renderCalculator()
    const user = userEvent.setup()

    // Wait for the calculator logic to finish loading before interacting.
    await findDisplayHeading('0')

    await user.click(await findButton('5'))
    await user.click(await findButton('+'))
    await user.click(await findButton('3'))
    await user.click(await findButton('='))

    await waitFor(async () => {
      expect(await findDisplayHeading('8')).toBeInTheDocument()
    })
  })
})
async function findButton(label: string) {
  const buttons = await screen.findAllByRole('button', { name: label })
  return buttons[buttons.length - 1]
}
