/**
 * Presentation layer for weekly polls.
 *
 * This file owns poll HTML generation only.
 *
 * Poll loading, vote persistence, result collection and event binding remain
 * in `src/features/polls/polls.ts`.
 */

interface PollViewState {
    voted: boolean;
    selectedOptionId: string | null;
    totalVotes: number;
    optionVotes: Readonly<Record<string, number>>;
}

/**
 * Renders the active weekly poll.
 *
 * @param poll - Active poll definition.
 * @param state - Current locally persisted vote state.
 * @returns Complete poll HTML.
 */
function renderPollView(
    poll: Poll,
    state: PollViewState
): string {
    const question = localizedValue(
        poll.question_fr,
        poll.question
    );

    return `
        <div style="
            background:#fff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
            margin-bottom:30px;
        ">
            ${renderPollHeaderView()}

            <div style="padding:30px;">
                <p
                    class="${localizedTextClass()}"
                    style="
                        font-size:18px;
                        font-weight:700;
                        color:#1a1a1a;
                        margin:0 0 24px;
                        line-height:1.5;
                    "
                >
                    ${question}
                </p>

                ${
                    state.voted
                    && state.selectedOptionId
                        ? renderPollResultsView(
                            poll,
                            state
                        )
                        : renderPollOptionsView(
                            poll
                        )
                }
            </div>
        </div>
    `;
}

/**
 * Renders the static poll header.
 *
 * @returns Poll header HTML.
 */
function renderPollHeaderView(): string {
    return `
        <div style="
            background:linear-gradient(
                135deg,
                #667eea 0%,
                #764ba2 100%
            );
            padding:24px 30px;
        ">
            <h2 style="
                font-size:22px;
                font-weight:700;
                color:#fff;
                margin:0 0 8px;
            ">
                📊 ${t("poll.weekly")}
            </h2>

            <p style="
                font-size:14px;
                color:rgba(255,255,255,0.9);
                margin:0;
            ">
                ${t("poll.subtitle")}
            </p>
        </div>
    `;
}

/**
 * Renders the available poll options before the learner votes.
 *
 * Interaction is exposed through `data-poll-id` and `data-option-id`.
 *
 * @param poll - Active poll.
 * @returns Poll option buttons HTML.
 */
function renderPollOptionsView(
    poll: Poll
): string {
    return poll.options
        .map(
            option =>
                renderPollOptionView(
                    poll.id,
                    option
                )
        )
        .join("");
}

/**
 * Renders one selectable poll option.
 *
 * @param pollId - Parent poll identifier.
 * @param option - Poll option.
 * @returns Option button HTML.
 */
function renderPollOptionView(
    pollId: string,
    option: PollOption
): string {
    const label = localizedValue(
        option.labelFr,
        option.labelFa
    );

    return `
        <button
            type="button"
            class="poll-option-btn"
            data-poll-id="${pollId}"
            data-option-id="${option.id}"
            style="
                width:100%;
                padding:16px 20px;
                font-size:15px;
                font-weight:600;
                border:2px solid #e0e0e0;
                border-radius:8px;
                background:#fff;
                color:#1a1a1a;
                cursor:pointer;
                margin-bottom:12px;
                text-align:inherit;
            "
        >
            ${label}
        </button>
    `;
}

/**
 * Renders poll results after a vote has been recorded.
 *
 * @param poll - Active poll.
 * @param state - Persisted vote/result state.
 * @returns Results and reset action HTML.
 */
function renderPollResultsView(
    poll: Poll,
    state: PollViewState
): string {
    return `
        <div style="
            background:#f0f9ff;
            border:2px solid #087F5B;
            border-radius:8px;
            padding:20px;
            margin-bottom:16px;
        ">
            ${poll.options
                .map(
                    option =>
                        renderPollResultOptionView(
                            option,
                            state
                        )
                )
                .join("")}

            <p style="
                font-size:13px;
                color:#777;
                margin:16px 0 0;
                text-align:center;
            ">
                ${t(
                    "poll.totalVotes",
                    {
                        count:
                            state.totalVotes
                    }
                )}
            </p>
        </div>

        <button
            id="poll-reset-btn"
            type="button"
            data-poll-id="${poll.id}"
            style="
                width:100%;
                padding:12px;
                font-size:14px;
                font-weight:600;
                border:1px solid #e0e0e0;
                border-radius:6px;
                background:#fff;
                color:#777;
                cursor:pointer;
            "
        >
            🔄 ${t("poll.changeVote")}
        </button>
    `;
}

/**
 * Renders one option in the poll results.
 *
 * @param option - Poll option.
 * @param state - Current poll state.
 * @returns Result-row HTML.
 */
function renderPollResultOptionView(
    option: PollOption,
    state: PollViewState
): string {
    const votes =
        state.optionVotes[
            option.id
        ] ?? 0;

    const percentage =
        state.totalVotes > 0
            ? Math.round(
                (
                    votes
                    / state.totalVotes
                ) * 100
            )
            : 0;

    const selected =
        option.id
        === state.selectedOptionId;

    const label = localizedValue(
        option.labelFr,
        option.labelFa
    );

    return `
        <div style="
            margin-bottom:16px;
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:8px;
                gap:12px;
            ">
                <span
                    class="${localizedTextClass()}"
                    style="
                        font-weight:${
                            selected
                                ? "700"
                                : "500"
                        };
                        color:${
                            selected
                                ? "#087F5B"
                                : "#1a1a1a"
                        };
                    "
                >
                    ${label}
                    ${selected ? " ✅" : ""}
                </span>

                <span style="
                    font-weight:700;
                    color:#087F5B;
                    flex-shrink:0;
                ">
                    ${percentage}%
                </span>
            </div>

            <div style="
                background:#e0e0e0;
                border-radius:4px;
                height:8px;
                overflow:hidden;
            ">
                <div style="
                    background:${
                        selected
                            ? "#087F5B"
                            : "#a7f3d0"
                    };
                    height:100%;
                    width:${percentage}%;
                    transition:width 0.5s;
                "></div>
            </div>
        </div>
    `;
}