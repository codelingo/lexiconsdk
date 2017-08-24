<?php

class FactPropDelta implements JsonSerializable {
    public $action;
    public $arg;
    public $prop;

    function __construct(string $action, string $arg, string $prop) {
        $this->action = $action;
        $this->arg = $arg;
        $this->prop = $prop;
    }

    function jsonSerialize() {
        return (object)[
            'action' => $this->action,
            'arg' => $this->arg,
            'prop' => $this->prop,
        ];
    }
}

function ReplaceProperties(string $fact) {
    $deltas = [];
    switch ($fact) {
        // No replacements yet
    }
    return $deltas;
}

$fact = $argv[1];
$deltas = ReplaceProperties($fact);
print json_encode($deltas);
