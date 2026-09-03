/**
 * Weekly poll controller and local vote persistence.
 *
 * This file owns:
 * - poll loading
 * - local vote persistence
 * - result aggregation
 * - poll interaction events
 *
 * HTML generation is delegated to `src/ui/views/pollsView.ts`.
 */

let pollDelegatedEventsBound = false;

/**
 * Loads and renders the active weekly poll.
 *
 * The returned HTML can be embedded into another page, such as the Home page.
 *
 * @returns Active poll HTML, or an empty string when no poll is available.
 */
async function renderPollSection(): Promise<string> {
    try {
        const response = await fetch(
            `./data/polls/polls.json?v=${Date.now()}`
        );

        if (!response.ok) {
            console.warn(
                "Polls file not found."
            );

            return "";
        }

        const pollsData = (await response.json()) as PollFile;

        const poll =
            pollsData.activePoll;

        if (!poll) {
            return "";
        }

        const state =
            getPollViewState(
                poll
            );

        return renderPollView(
            poll,
            state
        );
    } catch (error) {
        console.error(
            "Poll loading error:",
            error
        );

        return "";
    }
}

/**
 * Builds the presentation state of a poll from locally persisted vote data.
 *
 * @param poll - Active poll definition.
 * @returns Current vote and result state.
 */
function getPollViewState(
    poll: Poll
): PollViewState {
    const voted =
        localStorage.getItem(
            `dino_poll_voted_${poll.id}`
        ) === "true";

    const selectedOptionId =
        localStorage.getItem(
            `dino_poll_choice_${poll.id}`
        );

    const totalVotes =
        Number.parseInt(
            localStorage.getItem(
                `dino_poll_total_${poll.id}`
            )
            || "0",
            10
        );

    const optionVotes =
        poll.options.reduce<
            Record<string, number>
        >(
            (
                votes,
                option
            ) => {
                votes[option.id] =
                    Number.parseInt(
                        localStorage.getItem(
                            `dino_poll_${poll.id}_${option.id}`
                        )
                        || "0",
                        10
                    );

                return votes;
            },
            {}
        );

    return {
        voted,
        selectedOptionId,
        totalVotes,
        optionVotes
    };
}

/**
 * Persists one vote and refreshes the Home page.
 *
 * @param pollId - Poll identifier.
 * @param choice - Selected option identifier.
 */
function votePoll(
    pollId: string,
    choice: string
): void {
    localStorage.setItem(
        `dino_poll_voted_${pollId}`,
        "true"
    );

    localStorage.setItem(
        `dino_poll_choice_${pollId}`,
        choice
    );

    const currentCount =
        Number.parseInt(
            localStorage.getItem(
                `dino_poll_${pollId}_${choice}`
            )
            || "0",
            10
        );

    localStorage.setItem(
        `dino_poll_${pollId}_${choice}`,
        String(
            currentCount + 1
        )
    );

    const totalVotes =
        Number.parseInt(
            localStorage.getItem(
                `dino_poll_total_${pollId}`
            )
            || "0",
            10
        );

    localStorage.setItem(
        `dino_poll_total_${pollId}`,
        String(
            totalVotes + 1
        )
    );

    void showHome();
}

/**
 * Removes the learner's previous vote so another option can be selected.
 *
 * The locally aggregated counters are decremented consistently before the vote
 * marker is removed.
 *
 * @param pollId - Poll identifier.
 */
function resetPoll(
    pollId: string
): void {
    const previousChoice =
        localStorage.getItem(
            `dino_poll_choice_${pollId}`
        );

    if (previousChoice) {
        decrementPollOptionVote(
            pollId,
            previousChoice
        );

        decrementPollTotal(
            pollId
        );
    }

    localStorage.removeItem(
        `dino_poll_voted_${pollId}`
    );

    localStorage.removeItem(
        `dino_poll_choice_${pollId}`
    );

    void showHome();
}

/**
 * Decrements a persisted option counter without allowing negative values.
 *
 * @param pollId - Poll identifier.
 * @param optionId - Option identifier.
 */
function decrementPollOptionVote(
    pollId: string,
    optionId: string
): void {
    const storageKey =
        `dino_poll_${pollId}_${optionId}`;

    const currentCount =
        Number.parseInt(
            localStorage.getItem(
                storageKey
            )
            || "0",
            10
        );

    localStorage.setItem(
        storageKey,
        String(
            Math.max(
                0,
                currentCount - 1
            )
        )
    );
}

/**
 * Decrements the persisted total-vote counter without allowing negative
 * values.
 *
 * @param pollId - Poll identifier.
 */
function decrementPollTotal(
    pollId: string
): void {
    const storageKey =
        `dino_poll_total_${pollId}`;

    const totalVotes =
        Number.parseInt(
            localStorage.getItem(
                storageKey
            )
            || "0",
            10
        );

    localStorage.setItem(
        storageKey,
        String(
            Math.max(
                0,
                totalVotes - 1
            )
        )
    );
}

/**
 * Installs delegated poll interaction handlers.
 *
 * Poll HTML may be rendered as part of another page after this script has
 * loaded. Delegation on the persistent application root therefore avoids
 * inline HTML handlers and remains valid after `app.innerHTML` changes.
 */
function bindPollDelegatedEvents(): void {
    if (pollDelegatedEventsBound) {
        return;
    }

    app.addEventListener(
        "click",
        event => {
            const target =
                event.target;

            if (
                !(target instanceof Element)
            ) {
                return;
            }

            const optionButton =
                target.closest<HTMLButtonElement>(
                    ".poll-option-btn"
                );

            if (
                optionButton
                && app.contains(
                    optionButton
                )
            ) {
                const pollId =
                    optionButton.dataset.pollId;

                const optionId =
                    optionButton.dataset.optionId;

                if (
                    pollId
                    && optionId
                ) {
                    votePoll(
                        pollId,
                        optionId
                    );
                }

                return;
            }

            const resetButton =
                target.closest<HTMLButtonElement>(
                    "#poll-reset-btn"
                );

            if (
                !resetButton
                || !app.contains(
                    resetButton
                )
            ) {
                return;
            }

            const pollId =
                resetButton.dataset.pollId;

            if (!pollId) {
                return;
            }

            resetPoll(
                pollId
            );
        }
    );

    pollDelegatedEventsBound = true;
}

bindPollDelegatedEvents();