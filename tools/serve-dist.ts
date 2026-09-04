import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import {
    extname,
    resolve,
    sep
} from "node:path";

const distDirectory = resolve(
    import.meta.dirname,
    "..",
    "dist"
);

const host = "127.0.0.1";
const port = Number.parseInt(
    process.env.E2E_PORT ?? "4173",
    10
);

const contentTypes: Readonly<Record<string, string>> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};

if (
    !Number.isInteger(port)
    || port < 1
    || port > 65_535
) {
    throw new Error(
        "E2E_PORT must be a valid TCP port."
    );
}

const server = createServer(
    async (request, response) => {
        if (
            request.method !== "GET"
            && request.method !== "HEAD"
        ) {
            response.writeHead(405, {
                Allow: "GET, HEAD"
            });
            response.end();
            return;
        }

        try {
            const requestUrl = new URL(
                request.url ?? "/",
                `http://${host}:${port}`
            );

            const pathname = decodeURIComponent(
                requestUrl.pathname
            );

            const relativePath =
                pathname === "/"
                    ? "index.html"
                    : pathname.slice(1);

            const filePath = resolve(
                distDirectory,
                relativePath
            );

            const allowedPrefix =
                `${distDirectory}${sep}`;

            if (
                filePath !== distDirectory
                && !filePath.startsWith(
                    allowedPrefix
                )
            ) {
                response.writeHead(403);
                response.end("Forbidden");
                return;
            }

            const fileStats = await stat(
                filePath
            );

            if (!fileStats.isFile()) {
                response.writeHead(404);
                response.end("Not found");
                return;
            }

            response.writeHead(200, {
                "Cache-Control": "no-store",
                "Content-Type":
                    contentTypes[
                        extname(filePath)
                            .toLowerCase()
                    ]
                    ?? "application/octet-stream"
            });

            if (request.method === "HEAD") {
                response.end();
                return;
            }

            createReadStream(filePath)
                .pipe(response);
        } catch {
            response.writeHead(404);
            response.end("Not found");
        }
    }
);

server.listen(
    port,
    host,
    () => {
        console.log(
            `E2E server ready on http://${host}:${port}`
        );
    }
);

function stopServer(): void {
    server.close(error => {
        if (error) {
            console.error(error);
            process.exitCode = 1;
        }
    });
}

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);
