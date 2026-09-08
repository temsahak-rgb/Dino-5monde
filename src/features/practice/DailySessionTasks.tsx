import {
    Link
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    Badge,
    Card
} from "../../ui/components/Controls.js";
import {
    Section,
    SectionHeader
} from "../../ui/components/Layout.js";
import type {
    DailySessionTask
} from "./dailySessionPlan.js";

interface DailySessionTasksProps {
    items: readonly DailySessionTask[];
}

/** Three direct, ordered learning actions for the current day. */
function DailySessionTasks({
    items
}: DailySessionTasksProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    return (
        <Section>
            <SectionHeader
                title={t("daily.tasksTitle")}
                description={t("daily.tasksDescription")}
            />

            <ol className="grid gap-3">
                {items.map((item, index) => (
                    <li
                        key={[
                            item.contentType,
                            item.level ?? "",
                            item.id
                        ].join(":")}
                        data-daily-task
                        data-daily-reason={item.reason}
                    >
                        <Link
                            to={item.href}
                            className="block text-inherit no-underline"
                        >
                            <Card
                                interactive
                                className="flex min-h-[112px] items-center gap-3 p-4 sm:gap-4 sm:p-5"
                            >
                                <span
                                    className="grid size-10 shrink-0 place-items-center rounded-full bg-dino-100 text-base font-extrabold text-dino-800"
                                    aria-hidden="true"
                                >
                                    {index + 1}
                                </span>

                                <span
                                    className="hidden shrink-0 text-2xl min-[380px]:inline"
                                    aria-hidden="true"
                                >
                                    {item.icon}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className={"block font-bold text-ink " + localizedTextClass()}>
                                        {localizedValue(
                                            item.title,
                                            item.titleFa,
                                            item.id
                                        )}
                                    </span>
                                    <span className="mt-1 block text-sm text-muted">
                                        {getReasonLabel(item, t)}
                                    </span>
                                </span>

                                <Badge variant={item.reason === "discovery" ? "info" : "warning"}>
                                    {t("daily.openTask")}
                                </Badge>
                            </Card>
                        </Link>
                    </li>
                ))}
            </ol>
        </Section>
    );
}

function getReasonLabel(
    item: DailySessionTask,
    t: ReturnType<typeof useI18n>["t"]
): string {
    switch (item.reason) {
        case "score":
            return t(
                "daily.reason.score",
                {
                    percentage:
                        item.percentage ?? 0
                }
            );
        case "mistake":
            return t(
                "daily.reason.mistake",
                {
                    count:
                        item.detailCount ?? 0
                }
            );
        case "weak-word":
            return t(
                "daily.reason.weakWord",
                {
                    count:
                        item.detailCount ?? 0
                }
            );
        case "discovery":
            return t(
                "daily.reason.discovery"
            );
    }
}

export {
    DailySessionTasks
};
