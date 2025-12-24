import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { VocabularyPage } from './VocabularyPage'

function renderVocabulary() {
	return render(<VocabularyPage />)
}

describe('VocabularyPage', () => {
	it('renders the first flashcard and baseline stats', async () => {
		const view = renderVocabulary()

		await within(view.container).findByRole('heading', { name: /vocabulary flashcards/i })
		expect(
			await within(view.container).findByText('ephemeral', undefined, { timeout: 10000 }),
		).toBeInTheDocument()
		expect(await within(view.container).findByText('Card 1 of 5')).toBeInTheDocument()
		expect(await within(view.container).findByText('Studied: 0')).toBeInTheDocument()
		expect(await within(view.container).findByText('Remembered: 0')).toBeInTheDocument()
		expect(await within(view.container).findByText('Forgot: 0')).toBeInTheDocument()
	}, 15000)

	it('advances to the next card after reviewing with a quality score', async () => {
		const view = renderVocabulary()
		const user = userEvent.setup()

		// Wait for initial render
		await within(view.container).findByText('ephemeral', undefined, { timeout: 10000 })

		await user.click(await within(view.container).findByRole('button', { name: 'Show Answer' }))
		await user.click(await within(view.container).findByRole('button', { name: 'Good' }))

		await waitFor(
			() => {
				expect(within(view.container).getByText('ubiquitous')).toBeInTheDocument()
			},
			{ timeout: 5000 },
		)

		await waitFor(
			() => {
				expect(within(view.container).getByText('Card 2 of 5')).toBeInTheDocument()
			},
			{ timeout: 5000 },
		)

		await waitFor(
			() => {
				expect(within(view.container).getByText('Studied: 1')).toBeInTheDocument()
				expect(within(view.container).getByText('Remembered: 1')).toBeInTheDocument()
				expect(within(view.container).getByText('Forgot: 0')).toBeInTheDocument()
			},
			{ timeout: 5000 },
		)
	}, 20000)
})
