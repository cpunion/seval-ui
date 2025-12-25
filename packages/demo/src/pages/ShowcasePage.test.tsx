import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ShowcasePage } from './ShowcasePage'

function renderShowcase() {
	return render(<ShowcasePage />)
}

async function findTextFieldInput(labelText: string, root: ParentNode = document.body) {
	const label = await within(root).findByText(labelText)
	const textfield = label.closest('.a2ui-textfield') ?? label.parentElement
	if (!textfield) {
		throw new Error(`Unable to locate text field container for label: ${labelText}`)
	}
	return within(textfield).getByRole('textbox')
}

describe('ShowcasePage', () => {
	it('renders initial derived state from MiniJS runtime', async () => {
		const view = renderShowcase()
		const user = userEvent.setup()

		await within(view.container).findByRole('heading', { name: /a2ui component showcase/i })
		expect(await within(view.container).findByText('Count: 0')).toBeInTheDocument()
		expect(await within(view.container).findByText('Unchecked')).toBeInTheDocument()

		const todoTabButton = await within(view.container).findByRole('button', {
			name: 'Todo App',
		})
		await user.click(todoTabButton)

		expect(
			await within(view.container).findByText('1 of 3 completed', undefined, {
				timeout: 10000,
			}),
		).toBeInTheDocument()
	}, 15000)

	it('updates counter and todos through UI actions', async () => {
		const view = renderShowcase()
		const user = userEvent.setup()

		// Wait longer for seval compiler initialization
		await within(view.container).findByText('Count: 0', undefined, { timeout: 15000 })

		const incrementButtons = await within(view.container).findAllByRole('button', {
			name: '+',
		})
		const lastButton = incrementButtons[incrementButtons.length - 1]
		if (lastButton) await user.click(lastButton)

		await waitFor(
			() => {
				expect(within(view.container).getByText('Count: 1')).toBeInTheDocument()
			},
			{ timeout: 10000 },
		)

		const todoTabButton = await within(view.container).findByRole('button', {
			name: 'Todo App',
		})
		await user.click(todoTabButton)

		const todoInput = await findTextFieldInput('New todo:', view.container)
		await user.type(todoInput, 'Write Showcase tests')
		await user.click(await within(view.container).findByRole('button', { name: 'Add' }))

		await waitFor(
			() => {
				expect(within(view.container).getByText('Write Showcase tests')).toBeInTheDocument()
			},
			{ timeout: 10000 },
		)

		await waitFor(
			() => {
				expect(within(view.container).getByText('1 of 4 completed')).toBeInTheDocument()
			},
			{ timeout: 10000 },
		)
	}, 45000)
})
