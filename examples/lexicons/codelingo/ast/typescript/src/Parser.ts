import fs from "fs";
import path from "path";
import { AstNode, makeProperty } from "./AstNode";
import { KeyManager } from "./KeyManager";

const KIND_NS = "ts";
type EmitterFn = (node: AstNode) => void;

export function parseProject(trunkKey: string, baseDirStr: string, filepaths: string[] = [], emitter: EmitterFn) {
    const files: Set<string> = getFileSet(filepaths);
    const keyMan = new KeyManager(trunkKey);
    const parser = new Parser(baseDirStr, keyMan, files, emitter);

    const projectNode: AstNode = {
        commonKind: "project",
        kind: { kind: "project", namespace: KIND_NS, orderable: false },
        parentKey: "",
        key: trunkKey,
        olderSiblings: [],
        properties: {},
    };

    emitter(projectNode);
    parser.parseDir(projectNode.key, baseDirStr);
}

function getFileSet(filepaths: string[]) {
    const files = new Set<string>();
    if (filepaths.length === 0) {
        return files;
    }

    for (const filepath of filepaths) {
        const normalisedFilepath = !filepath.startsWith("./") ? `./${filepath}` : `${filepath}`;
        files.add(normalisedFilepath);
    }
    return files;
}

export class Parser {
    private readonly baseDir: string;
    private readonly keyMan: KeyManager;
    private readonly files: Set<string>;
    private readonly parseAll: boolean;
    private readonly allowedExtensions = [".ts"];
    private readonly emit: (node: AstNode) => void;

    constructor(baseDir: string, keyMan: KeyManager, files: Set<string>, emitter: EmitterFn) {
        this.baseDir = baseDir;
        this.keyMan = keyMan;
        this.files = files;
        this.parseAll = this.files.size == 0;
        this.emit = emitter;
    }

    parseDir(parentKey: string, dir: string): boolean {
        let hasFiles = false;
        const relFilePath = makeRelativePath(this.baseDir, dir);

        const dirNode: AstNode = {
            commonKind: "dir",
            kind: { kind: "dir", namespace: KIND_NS, orderable: false },
            properties: { filename: makeProperty("filename", relFilePath) },
            key: this.keyMan.getKey(),
            parentKey: parentKey,
            olderSiblings: [],
        };

        const files: string[] = [];
        for (const child of fs.readdirSync(dir)) {
            const childPath = path.join(dir, child);
            if (fs.statSync(childPath).isFile()) {
                files.push(childPath);
                continue;
            }

            if (this.parseDir(dirNode.key, childPath)) {
                hasFiles = true;
            }
        }

        for (const file of files) {
            const ext = path.extname(file);
            if (!this.allowedExtensions.includes(ext)) {
                continue;
            }

            if (this.parseFile(dirNode.key, file)) {
                hasFiles = true;
            }
        }

        if (hasFiles) {
            this.emit(dirNode);
        }

        return hasFiles;
    }

    parseFile(parentKey: string, absFilePath: string): boolean {
        const relFilePath = makeRelativePath(this.baseDir, absFilePath);

        if (!this.parseAll) {
            if (!this.files.has(relFilePath)) {
                return false;
            }
        }

        const fileNode: AstNode = {
            commonKind: "file",
            kind: { kind: "file", namespace: KIND_NS, orderable: true },
            key: this.keyMan.getKey(),
            parentKey: parentKey,
            olderSiblings: [],
            properties: {
                filename: makeProperty("filename", relFilePath),
                start_column: makeProperty("start_column", 0),
                start_line: makeProperty("start_line", 0),
                start_offset: makeProperty("start_offset", 0),
                end_column: makeProperty("end_column", 0),
                end_line: makeProperty("end_line", 0),
                end_offset: makeProperty("end_offset", 0),
            },
        };

        this.emit(fileNode);

        // var nodeWalker = new S

        return true;
    }
}

function makeRelativePath(basePath: string, childPath: string): string {
    const normRelPath = path.relative(basePath, childPath).replace(/\\/g, "/");
    if (normRelPath.startsWith(".") || normRelPath.startsWith("/")) {
        return normRelPath;
    }
    return `./${normRelPath}`;
}
