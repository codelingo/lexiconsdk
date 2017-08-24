<?php

require_once __DIR__.'/vendor/autoload.php';

use PhpParser\ParserFactory;
use PhpParser\Node;
use PhpParser\NodeVisitorAbstract;
use PhpParser\Lexer;

const allowedExtensions = ["php"];

function exception_error_handler($errno, $errstr, $errfile, $errline ) {
    throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}
set_error_handler("exception_error_handler");

class Parser {
    /**
     * @var string
     */
    private $baseDir;
    /**
     * @var KeyManager
     */
    private $keyMan;
    /**
     * @var array
     */
    private $files;
    /**
     * @var PhpParser\Parser\
     */
    private $fileParser;
    /**
     * @var bool
     */
    private $parseAll;

    function __construct($baseDir, $keyMan, $files) {
        $this->baseDir = $baseDir;
        $this->keyMan = $keyMan;
        $this->files = $files;
        $this->parseAll = count($files) == 0;

        $lexer = new Lexer([
            'usedAttributes' => [
                'comments', 'startLine', 'endLine',
                'startFilePos', 'endFilePos'
            ]
        ]);
        $this->fileParser = (new ParserFactory)->create(ParserFactory::PREFER_PHP7, $lexer);
    }

    function ParseDir(string $parentKey, SplFileInfo $dir) {
        $hasFiles = false;
        $absFilePath = $dir->getRealPath();
        $relFilePath = getRelativePath($this->baseDir, $absFilePath);

        $dirNode = new AstNode();
        $dirNode->kind = new LexiconKind("php", "dir", false);
        $dirNode->setCommonKind();
        $dirNode->parent_key = $parentKey;
        $dirNode->key = $this->keyMan->getKey();
        $dirNode->setProperty("filename", $relFilePath);

        $dirItr = new DirectoryIterator($absFilePath);
        foreach ($dirItr as $fileinfo) {
            if (!$fileinfo->isDot()) {
                if ($fileinfo->isDir()) {
                    if ($this->ParseDir($dirNode->key, $fileinfo)) {
                        $hasFiles = true;
                    }
                } elseif ($fileinfo->isFile()) {
                    $ext = strtolower($fileinfo->getExtension());
                    if (in_array($ext, allowedExtensions, true)) {
                        if ($this->ParseFile($dirNode->key, $fileinfo->getRealPath())) {
                            $hasFiles = true;
                        }
                    }
                }
            }
        }

        if ($hasFiles) {
            printNode($dirNode);
        }

        return $hasFiles;
    }

    function ParseFile(string $parentKey, string $absFilePath) {
        $relFilePath = getRelativePath($this->baseDir, $absFilePath);
        if (!$this->parseAll) {
            if (!array_key_exists($relFilePath, $this->files)) {
                return false;
            }
        }

        $code = file_get_contents($absFilePath);

        $fileNode = new AstNode();
        $fileNode->kind = new LexiconKind("php", "file", true);
        $fileNode->setCommonKind();
        $fileNode->parent_key = $parentKey;
        $fileNode->key = $this->keyMan->getKey();
        $fileNode->setProperty("filename", $relFilePath);
        $fileNode->setProperty("start_column", 0);  // TODO: handle in SRC lexicon https://github.com/codelingo/platform/issues/318
        $fileNode->setProperty("start_line", 0);
        $fileNode->setProperty("start_offset", 0);
        $fileNode->setProperty("end_column", 0);
        $fileNode->setProperty("end_line", 0);
        $fileNode->setProperty("end_offset", 0);
        printNode($fileNode);

        $traverser = new PhpParser\NodeTraverser();
        $traverser->addVisitor(new PhpParser\NodeVisitor\NameResolver);
        $traverser->addVisitor(new NodePrintVisitor($relFilePath, $code, $this->keyMan, $fileNode->key));
        $errorHandler = new PhpParser\ErrorHandler\Collecting;
        $nodes = $this->fileParser->parse($code, $errorHandler);
        foreach ($errorHandler->getErrors() as $error) {
            if( strpos( $error->getMessage(), "Syntax error") === false ) {
                throw new Exception(sprintf("message=%s trace=%s", $error->getMessage(), $error->getTraceAsString()));
            }
        }
        $traverser->traverse($nodes);

        return true;
    }

}

class KeyManager {
    private $trunk;
    private $num;

    function __construct(string $trunkKey) {
        $parts = explode("_", $trunkKey);
        switch (count($parts)) {
            case 2:
                $this->trunk = (int)$parts[0];
                $this->num = (int)$parts[1];
                break;
            case 1:
                $this->trunk = (int)$parts[0];
                $this->num = 0;
                break;
            default:
                throw new Exception(sprintf("invalid trunk key format: %s", $trunkKey));
        }
    }

    public function getKey() {
        $this->num += 1;
        $key = implode("_", [$this->trunk, $this->num]);
        return $key;
    }
}

class NodePrintVisitor extends NodeVisitorAbstract {
    private $code;
    private $filename;
    private $keyMan;
    private $parentKey;
    private $stack;

    public function enterNode(Node $node) {
        if ($node->getType() == "Stmt_Nop") {
            // Ignore all Stmt_Nop nodes since they have no properties
            return;
        }

        $lexNode = AstNode::withNode($this->filename, $this->code, $node);
        $lexNode->key = $this->keyMan->getKey();
        if (empty($this->stack)) {
            $lexNode->parent_key = $this->parentKey;
        } else {
            $parentNode = $this->stack[count($this->stack)-1];
            $lexNode->olderSiblings = $parentNode->childKeys;
            $parentNode->childKeys[] = $lexNode->key;
            $lexNode->parent_key = $parentNode->key;
        }
        printNode($lexNode);

        $this->stack[] = $lexNode;
    }

    public function leaveNode(Node $node) {
        if ($node->getType() == "Stmt_Nop") {
            return;
        }
        array_pop($this->stack);
    }

    public function __construct(string $filename, string $code, KeyManager $keyMan, string $parentKey) {
        $this->code = $code;
        $this->filename = $filename;
        $this->keyMan = $keyMan;
        $this->parentKey = $parentKey;
        $this->stack = [];
    }
}

class Property {
    public $type;
    public $value;

    function __construct(string $type, string $value) {
        $this->type = $type;
        $this->value = $value;
    }
}

class AstNode implements JsonSerializable {
    public $common_kind = "unknown";
    public $key;
    public $kind;
    public $parent_key;
    public $properties;
    public $olderSiblings;
    public $childKeys;

    public function __construct() {
        $this->olderSiblings = [];
        $this->childKeys = [];
        $this->properties = new stdClass();
    }

    public static function withNode(string $filename, string $code, Node $node) {
        $instance = new self();
        $instance->kind = new LexiconKind("php", strtolower($node->getType()), true);
        $instance->setCommonKind();

        // Position properties
        $instance->setProperty("filename", $filename);
        $instance->setProperty("start_column", $instance->toColumn($code, $node->getAttribute("startFilePos")));
        $instance->setProperty("start_line", $node->getAttribute("startLine"));
        $instance->setProperty("start_offset", $node->getAttribute("startFilePos"));
        $instance->setProperty("end_column", $instance->toColumn($code, $node->getAttribute("endFilePos")));
        $instance->setProperty("end_line", $node->getAttribute("endLine"));
        $instance->setProperty("end_offset", $node->getAttribute("endFilePos"));

        // Set attributes as properties
        $attributes = $node->getAttributes();
        foreach($attributes as $key => $value) {
            if (is_null($value)) {
                continue;
            }
            if (substr($key, 0, 5) === 'start' || substr($key, 0, 3) === 'end') {
                continue;
            }
            if (is_scalar($value)) {
                $instance->setProperty($key, strval($value));
            }
        }

        // Convert 'magic' values into usable values
        foreach($node->getSubNodeNames() as $name) {
            $subNode = $node->$name;
            $value = null;
            if (is_scalar($subNode)) {
                if ($name === 'flags' || $name === 'newModifier') {
                    $value = $instance->dumpFlags($subNode);
                } else if ($name === 'type' && $node instanceof Node\Expr\Include_) {
                    $value = $instance->dumpIncludeType($subNode);
                } else if ($name === 'type'
                    && ($node instanceof Node\Stmt\Use_ || $node instanceof Node\Stmt\UseUse || $node instanceof Node\Stmt\GroupUse)) {
                    $value = $instance->dumpUseType($subNode);
                } elseif (!is_array($subNode) && !($subNode instanceof Node)) {
                    $value = strval($subNode);
                }
            }
            if (!is_null($value)) {
                $instance->setProperty($name, $value);
            }
        }

        return $instance;
    }

    public function setProperty(string $key, string $value) {
        // TODO: Properly handle oddities: https://github.com/codelingo/lexicon/issues/75
        $value = mb_convert_encoding($value, 'UTF-8');
        $this->properties->$key = new Property(gettype($value), $value);
    }

    public function jsonSerialize() {
        return (object)[
            'commonKind' => $this->common_kind,
            'key' => $this->key,
            'kind' => $this->kind,
            'parentKey' => $this->parent_key,
            'properties' => $this->properties,
            'olderSiblings' => $this->olderSiblings,
        ];
    }

    function dumpFlags($flags) {
        $strs = [];
        if ($flags & Node\Stmt\Class_::MODIFIER_PUBLIC) {
            $strs[] = 'MODIFIER_PUBLIC';
        }
        if ($flags & Node\Stmt\Class_::MODIFIER_PROTECTED) {
            $strs[] = 'MODIFIER_PROTECTED';
        }
        if ($flags & Node\Stmt\Class_::MODIFIER_PRIVATE) {
            $strs[] = 'MODIFIER_PRIVATE';
        }
        if ($flags & Node\Stmt\Class_::MODIFIER_ABSTRACT) {
            $strs[] = 'MODIFIER_ABSTRACT';
        }
        if ($flags & Node\Stmt\Class_::MODIFIER_STATIC) {
            $strs[] = 'MODIFIER_STATIC';
        }
        if ($flags & Node\Stmt\Class_::MODIFIER_FINAL) {
            $strs[] = 'MODIFIER_FINAL';
        }

        if ($strs) {
            return implode(' | ', $strs) . ' (' . $flags . ')';
        } else {
            return $flags;
        }
    }

    function dumpIncludeType($type) {
        $map = [
            Node\Expr\Include_::TYPE_INCLUDE      => 'TYPE_INCLUDE',
            Node\Expr\Include_::TYPE_INCLUDE_ONCE => 'TYPE_INCLUDE_ONCE',
            Node\Expr\Include_::TYPE_REQUIRE      => 'TYPE_REQUIRE',
            Node\Expr\Include_::TYPE_REQUIRE_ONCE => 'TYPE_REQURE_ONCE',
        ];

        if (!isset($map[$type])) {
            return $type;
        }
        return $map[$type] . ' (' . $type . ')';
    }

    function dumpUseType($type) {
        $map = [
            Node\Stmt\Use_::TYPE_UNKNOWN  => 'TYPE_UNKNOWN',
            Node\Stmt\Use_::TYPE_NORMAL   => 'TYPE_NORMAL',
            Node\Stmt\Use_::TYPE_FUNCTION => 'TYPE_FUNCTION',
            Node\Stmt\Use_::TYPE_CONSTANT => 'TYPE_CONSTANT',
        ];

        if (!isset($map[$type])) {
            return $type;
        }
        return $map[$type] . ' (' . $type . ')';
    }

    function toColumn($code, $pos) {
        if ($pos > strlen($code)) {
            throw new \RuntimeException('Invalid position information');
        }

        $lineStartPos = strrpos($code, "\n", $pos - strlen($code));
        if (false === $lineStartPos) {
            $lineStartPos = -1;
        }

        return $pos - $lineStartPos;
    }

    function setCommonKind() {
        $map = [
            "dir" => "dir",
            "file" => "file",
            "project" => "project",
            "stmt_function" => "func",
            "expr_funccall" => "call",
            "expr_variable" => "var",
            "arg" => "arg",
            "expr_include" => "import",
            "block" => "block",
            "stmt_declare" => "decl",
            "stmt" => "stmt",
        ];

        $kind = $this->kind->kind;
        if (startsWith($kind, "stmt")) {
            $kind = $map["stmt"];
        }
        if (array_key_exists($kind, $map)) {
            $this->common_kind = $map[$kind];
        } else {
            $this->common_kind = "unknown";
        }

    }
}

class LexiconKind implements JsonSerializable {
    public $namespace;
    public $kind;
    public $orderable;

    function __construct($namespace, $kind, $orderable) {
        $this->namespace = $namespace;
        $this->kind = $kind;
        $this->orderable = $orderable;
    }

    public function jsonSerialize() {
        return (object)[
            'namespace' => $this->namespace,
            'kind' => $this->kind,
            'orderable' => $this->orderable,
        ];
    }
}

function getRelativePath($from, $to) {
    // some compatibility fixes for Windows paths
    $from = is_dir($from) ? rtrim($from, '\/') . '/' : $from;
    $to   = is_dir($to)   ? rtrim($to, '\/') . '/'   : $to;
    $from = str_replace('\\', '/', $from);
    $to   = str_replace('\\', '/', $to);

    $from     = explode('/', $from);
    $to       = explode('/', $to);
    $relPath  = $to;

    foreach($from as $depth => $dir) {
        // find first non-matching dir
        if($dir === $to[$depth]) {
            // ignore this directory
            array_shift($relPath);
        } else {
            // get number of remaining dirs to $from
            $remaining = count($from) - $depth;
            if($remaining > 1) {
                // add traversals up to first matching dir
                $padLength = (count($relPath) + $remaining - 1) * -1;
                $relPath = array_pad($relPath, $padLength, '..');
                break;
            } else {
                $relPath[0] = './' . $relPath[0];
            }
        }
    }

    $relPathStr = implode('/', $relPath);
    if ($relPathStr == "") {
        return ".";
    }
    $prefix = "./";
    if (!startsWith($relPathStr, $prefix)) {
        $relPathStr = $prefix.$relPathStr;
    }

    return $relPathStr;
}

function startsWith($haystack, $needle)
{
    $length = strlen($needle);
    return (substr($haystack, 0, $length) === $needle);
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }

    return (substr($haystack, -$length) === $needle);
}

function printNode($node) {
        $json = json_encode($node, JSON_UNESCAPED_UNICODE);
        if ($json) {
            print $json . "\r\n";
        } else {
            // TODO: Add logging when a node has been ignored
        }
}

$trunkKey = $argv[1];
$baseDirStr = $argv[2];
$files = [];
if (count($argv) > 3) {
    $fileArgs = array_slice($argv, 3);
    foreach ($fileArgs as $fileArg) {
        if (!startsWith($fileArg, "./")) {
            $fileArg = "./" . $fileArg;
        }
        $files[$fileArg] = true;
    }
}

$keyMan = new KeyManager($trunkKey);
$parser = new Parser($baseDirStr, $keyMan, $files);

$projectNode = new AstNode();
$projectNode->kind = new LexiconKind("php","project", false);
$projectNode->setCommonKind();
$projectNode->parent_key = "";
$projectNode->key = $trunkKey;
printNode($projectNode);

$baseDir = new SplFileInfo($baseDirStr);
$parser->ParseDir($projectNode->key, $baseDir);
