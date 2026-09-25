import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

for (const fileName of readdirSync(distDirectory)) {
    if (fileName.endsWith(".d.mts")) {
        rmSync(join(distDirectory, fileName));
    }
}
