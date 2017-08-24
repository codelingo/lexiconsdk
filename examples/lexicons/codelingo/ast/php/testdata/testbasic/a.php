<?php

require_once __DIR__.'/b.php';

class A {
    static public $num = 17;
}

$a = A::$num;
$b = B::$num;
$c = 5;
$d = $bnum;

class B {
    static public $num = 4;
}

$bnum = 8;
