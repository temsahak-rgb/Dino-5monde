import type {
    CSSProperties
} from "react";

interface DinoMascotProps {
    size?: number;
    className?: string;
    label?: string;
}

interface MascotStyle
    extends CSSProperties {
    "--dino-mascot-size": string;
}

/**
 * Lightweight, code-owned product mascot.
 *
 * The SVG has no external asset dependency and stays decorative when the
 * surrounding control already has an accessible name.
 */
function DinoMascot({
    size = 34,
    className = "",
    label
}: DinoMascotProps) {
    const style:
        MascotStyle = {
            "--dino-mascot-size":
                `${size}px`
        };

    return (
        <span
            className={`
                dino-mascot
                ${className}
            `}
            style={style}
            role={
                label
                    ? "img"
                    : undefined
            }
            aria-label={label}
            aria-hidden={
                label
                    ? undefined
                    : true
            }
            data-dino-mascot="true"
        >
            <svg
                viewBox="0 0 160 160"
                focusable="false"
                aria-hidden="true"
            >
                <ellipse
                    className="dino-mascot__shadow"
                    cx="82"
                    cy="139"
                    rx="43"
                    ry="7"
                />

                <g className="dino-mascot__character">
                    <path
                        className="dino-mascot__tail"
                        d="M103 91 C128 93 141 79 138 59 C146 75 144 93 133 103 C124 111 113 111 101 105 Z"
                    />

                    <path
                        className="dino-mascot__leg dino-mascot__leg--back"
                        d="M87 108 L103 109 L101 130 L111 132 C115 133 114 138 110 139 L94 139 C90 139 88 136 89 132 Z"
                    />

                    <path
                        className="dino-mascot__body"
                        d="M54 70 C54 54 68 46 84 48 C103 51 113 65 111 88 L108 108 C106 119 96 125 82 124 C63 123 51 113 50 96 Z"
                    />

                    <path
                        className="dino-mascot__belly"
                        d="M72 74 C84 72 98 78 101 91 C104 104 98 117 86 122 C74 121 66 116 63 106 C60 94 63 82 72 74 Z"
                    />

                    <path
                        className="dino-mascot__leg dino-mascot__leg--front"
                        d="M64 108 L79 111 L74 131 L84 133 C88 134 87 139 83 140 L66 140 C62 140 60 137 61 133 Z"
                    />

                    <g className="dino-mascot__arms">
                        <path
                            d="M96 77 C109 78 113 83 114 91 C111 89 107 87 101 88 Z"
                        />
                        <path
                            d="M61 76 C52 78 47 83 45 91 C50 87 55 87 61 89 Z"
                        />
                    </g>

                    <path
                        className="dino-mascot__neck"
                        d="M57 74 L56 50 L85 50 L90 76 Z"
                    />

                    <g className="dino-mascot__head">
                        <path
                            className="dino-mascot__head-shape"
                            d="M43 25 C43 19 48 15 54 15 L75 15 C86 15 92 22 92 32 L92 47 C92 55 86 61 78 61 L55 61 C47 61 42 56 42 48 Z"
                        />
                        <path
                            className="dino-mascot__snout"
                            d="M42 38 L71 38 C76 38 79 42 79 47 C79 52 75 55 70 55 L49 55 C44 55 41 51 41 46 Z"
                        />
                        <g className="dino-mascot__eye">
                            <circle
                                className="dino-mascot__eye-white"
                                cx="72"
                                cy="29"
                                r="5.5"
                            />
                            <circle
                                className="dino-mascot__pupil"
                                cx="73"
                                cy="29"
                                r="2.4"
                            />
                        </g>
                        <circle
                            className="dino-mascot__nostril"
                            cx="51"
                            cy="43"
                            r="1.7"
                        />
                        <path
                            className="dino-mascot__mouth"
                            d="M48 51 C56 54 64 54 71 51"
                        />
                    </g>

                    <g className="dino-mascot__spikes">
                        <path d="M89 57 L99 53 L94 65 Z" />
                        <path d="M99 67 L110 65 L103 77 Z" />
                        <path d="M107 80 L119 81 L109 91 Z" />
                    </g>
                </g>
            </svg>
        </span>
    );
}

export {
    DinoMascot
};

export type {
    DinoMascotProps
};
