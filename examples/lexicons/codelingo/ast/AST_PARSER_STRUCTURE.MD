# AST Parser

A lot of the code in the AST parser is generic boilerplate.

This doc aims to outline the main components of the parser binary.

## Usage

- The AST lexicon is run from the command line. 
- Each node should be printed as JSON to stdout on a single line.
- Errors / exceptions can be left uncaught as long as the program crashes or prints anything that isn't a JSON node.


## Structure

An outline of the main parts of AST lexicons.

#### Main function

Runs the lexicon from the command line:
`./<lexicon_binary> <trunkKey> <baseDir> [changedFiles...]`

The arguments are index based as follows (assuming filename as index 0):
- [1] trunkKey is an integer. supply to the key manager
- [2] baseDir is a string. used by file / directory iterator.
- [3...] changeFiles is a string array. if optionally supplied, only parse files in this array.

1. Create a key manager instance.
2. Create a parser instance.
3. Print project node.
4. Parent key is empty string.
5. Recursively iterate from baseDir calling `ParseDir`.


#### ParseDir function

1. Iterate specific files calling `ParseFile` and all subdirectories recursively calling `ParseDir`.
2. Print directory node if has any files that will be parsed.
3. Parent key is immediate parent directory node or project node.


#### ParseFile function

1. Grab code as string from file.
2. Print file node.
3. Parent key is immediate parent directory.
4. Run AST parser on file.


#### KeyManager class

1. Construct instance from string key, eg. `"4"` or `"4_12"`
2. Store left and right parts of key.
3. Right side always starts at 1, eg. `"4_1"`
4. Increment right part whenever getKey called.
5. Never increment left part.


#### Node class

1. "commonKind" only needs to be set on `project`, `dir`, and `file` nodes. The others are optional.
2. "key" must be set and unique. Use keyMan.
3. "parentKey" must be set.
4. "properties" must at least contain: `filename`, `start_column`, `start_line`, `end_column`, `end_line` for each AST node. Not applicable for `project`, `dir`, or `file` nodes.
    - property types should be like `string`, `int`, `bool`, `float`. if the type can't be determined platform side, it will default to string.
5. "olderSiblings" a nice to have.
6. "childKeys" a helper to "olderSiblings". Don't print in the node json.
