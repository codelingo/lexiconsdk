## Intro
This tutorial explains how the AST (abstract syntax tree) server works and how to go about creating a new AST lexicon, using the existing PHP lexicon as a reference.


## About the AST server
The AST server is generic and can theoretically support parsing in any language (ie. Java, PHP, GoLang, etc.) assuming that the correct data format is being used.

The AST server is configured by 3 things:
- A [server-config.yaml](#server-config-yaml)
- A [Dockerfile](#dockerfile)
- A [setup.json](#setup-json)  (not created by lexicon authors)


## Creating a new AST lexicon
1. Create an AST parser for a specific language, making sure it only outputs [nodes](#nodes).
2. Create a [server-config.yaml](#server-config-yaml) file that includes your new parser.
3. Create a [Dockerfile](#dockerfile) that supports your new parser.
4. Test the parser using the `ast-server` and `test-client` in the "bin" folder.


## Data types
The AST server always expects some kind of JSON the [endpoints](#endpoints) it invokes.


#### <a name="nodes"></a> Nodes
Nodes are the only thing that a parser should output.

Each node in the AST parser should be printed out on a single line in the JSON format below.
```json
{
    "commonKind": "string",
    "key": "string",
    "kind": {
        "namespace": "string",
        "kind": "string",
    },
    "parentKey": "string",
    "properties": [
        {
            "type": "string",
            "value": "string"
        }
    ]
}
```

## <a name="server-config-yaml"></a> server-config.yaml
See the PHP example: [server-config.yaml](./php/server-config.yaml)

This file is responsible for changing the generic AST server into a working AST lexicon and lives at `/server/server-config.yaml`.

The server has a number of endpoints that get called on the container's command line.
These commands, and any arguments, are read from the server-config.yaml file.

It is important that the specified commands are installed on the hosting container - this is the reason for the Dockerfile.


#### <a name="endpoints"></a> Endpoints
The server config is a map of endpoints, where an endpoint is a command with any number of arguments.

When requested, the AST server will lookup the endpoint map for the corresponding function name, eg. `parse-project`.

It will then execute the [command](#commands) with the ordered list of [arguments](#arguments).


#### <a name="commands"></a> Commands
Commands are executable binaries that can be found on the container's `$PATH`.
The [Dockerfile](#dockerfile) is used to install and configure commands on the container.

It is expected that any given command will output to STDOUT so the AST server can capture it's output.

A command may have any number of [arguments](#arguments).


#### <a name="arguments"></a> Arguments
Arguments are extra data used to configure a command.

There are two kinds of arguments that the server-config.yaml file uses: static and variable.

Static arguments are hardcoded values inside the server-config.yaml file. Most filepaths  will be static arguments.

Variable arguments are values that are given by the AST server when the command is executed.
They have the `${variable}` syntax and are only expected by the server on certain endpoints.


## <a name="dockerfile"></a> Dockerfile
See the PHP example: [Dockerfile](./php/Dockerfile)

If you're not familiar with Dockerfiles, I suggest reading up on them [here](https://docs.docker.com/engine/reference/builder/).

In short, Dockerfiles specify the operating system and the environment that the lexicon will run in.

Many programming languages have official Docker images that already have the environment setup and configured to be used out of the box.
This is usually the best place to start.

The AST server has to be run on Linux and we prefer the images to be as small as possible.
Ideally choose Alpine Linux if possible since they are created with a compact size in mind.

A lexicon author should write a Dockerfile to support the commands they use in the server-config.yaml.
Please make sure that any dependencies have been correctly installed too.

The annotated PHP example above should be enough to give you the general idea of how these work.


## <a name="setup-json"></a> setup.json
See the PHP example: [setup.json](./php/setup.json)

This file lives at `/setup/setup.json`.

A lexicon author doesn't need to write any setup.json files - the CodeLingo Platform dynamically creates these based on the queries it receives.


#### Resource actions
A resource is usually a directory of parsable language files (ie. *.php, *.java).
The resource action tells the server how to get the resource and set it up so it's ready to be parsed.

In the PHP example above, the resource action is initialize testing.
This tells the server to look at the `/testdata/` directory and to get ready to load and run tests when requested.

Pulling in repository from Github or Perforce are other examples of resource actions, but are beyond the scope of this tutorial since they are separate VCS (Version Control System) lexicons.


#### Parse actions
The parse action(s) tells the server what kind of parsing to do on the resource.

Most of the time this will be `parse-project` but there are some other kinds like `changed-files` that will only parse specific files instead of a whole directory.
