import {
    useEffect,
    useState
} from "react";

/**
 * Returns a stable date for the current local day and refreshes just after
 * midnight. Daily features can share this clock without each owning a timer.
 */
function useCurrentLocalDay(): Date {
    const [today, setToday] =
        useState(
            () => new Date()
        );

    useEffect(
        () => {
            const current =
                new Date();
            const nextDay =
                new Date(
                    current.getFullYear(),
                    current.getMonth(),
                    current.getDate() + 1
                );
            const timer =
                window.setTimeout(
                    () => {
                        setToday(
                            new Date()
                        );
                    },
                    Math.max(
                        1_000,
                        nextDay.getTime()
                        - current.getTime()
                        + 100
                    )
                );

            return () => {
                window.clearTimeout(timer);
            };
        },
        [today]
    );

    return today;
}

export {
    useCurrentLocalDay
};
