import bar
from baz import Baz


class Foo(object):
    def __init__(self, num):
        self.num = 4


foo = Foo(9)
foo.num = 11

bar = bar.Bar(5)
bar.num = foo.num

baz = Baz(13)
baz.num = 17

num = 11
