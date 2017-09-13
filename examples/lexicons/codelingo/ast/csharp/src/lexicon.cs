using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace Lexicon {
    class Lexicon {
        private const string kindNs = "csharp";

        public class AstNode {
            public string commonKind;
            public Kind kind;
            public string key;
            public string[] olderSiblings = new string[0];
            public string parentKey;
            public Dictionary<string, Property> properties = new Dictionary<string, Property>();
            
            [JsonIgnore]
            public List<string> childKeys = new List<string>();

            public AstNode(string commonKind, Kind kind) {
                this.commonKind = commonKind;
                this.kind = kind;
            }

            public void SetProperty(string pKey, Object pValue) {
                var valType = pValue == null ? "null" : pValue.GetType().Name;
                var val = pValue == null ? "" : pValue.ToString();
                this.properties[pKey] = new Property(valType, val);
            }
        }

        public class Kind {
            public string kind;
            public string @namespace;
            public bool orderable;

            public Kind(string kind, string @namespace, bool orderable) {
                this.kind = kind;
                this.@namespace = @namespace;
                this.orderable = orderable;
            }
        }

        public class Property {
            public string type;
            public string value;

            public Property(string type, string value) {
                this.type = type;
                this.value = value;
            }
        }

        public class KeyManager {
            private int trunk;
            private int num;

            public KeyManager(string trunkKey) {
                string[] strSep = {"_"};
                string[] parts = trunkKey.Split(strSep,
                    StringSplitOptions.RemoveEmptyEntries);
                switch (parts.Length) {
                    case 2:
                        Int32.TryParse(parts[0], out trunk);
                        Int32.TryParse(parts[1], out num);
                        break;
                    case 1:
                        Int32.TryParse(parts[0], out trunk);
                        num = 0;
                        break;
                    default:
                        throw new Exception(String.Format("invalid trunk key format: {0}", trunkKey));
                }
            }

            public string GetKey() {
                num += 1;
                string key = trunk + "_" + num;
                return key;
            }
        }

        public class AstNodeWalker : CSharpSyntaxWalker {
            private string filename;
            private Stack<AstNode> stack = new Stack<AstNode>();
            private KeyManager keyMan;
            private string parentKey;

            public AstNodeWalker(string filename, KeyManager keyMan, string parentKey) {
                this.filename = filename;
                this.keyMan = keyMan;
                this.parentKey = parentKey;
            }

            public override void Visit(SyntaxNode node) {
                var ns = node.Language == "C#" ? kindNs : node.Language;
                var kind = new Kind(node.Kind().ToString(), ns, true);
                var aNode = new AstNode("unknown", kind);
                var span = node.GetLocation().GetLineSpan();
                aNode.key = keyMan.GetKey();
                
                aNode.SetProperty("filename", this.filename);
                aNode.SetProperty("start_column", span.StartLinePosition.Character);
                aNode.SetProperty("start_line", span.StartLinePosition.Line);
                aNode.SetProperty("start_offset", node.Span.Start);
                aNode.SetProperty("end_column", span.EndLinePosition.Character);
                aNode.SetProperty("end_line", span.EndLinePosition.Line);
                aNode.SetProperty("end_offset", node.Span.End);

                if (stack.Count == 0) {
                    aNode.parentKey = parentKey;
                } else {
                    var parentNode = stack.Peek();
                    aNode.olderSiblings = parentNode.childKeys.ToArray();
                    parentNode.childKeys.Add(aNode.key);
                    aNode.parentKey = parentNode.key;
                }

                foreach (var tok in node.ChildTokens()) {
                    var kindStr = tok.Kind().ToString();
                    var value = tok.Value;
                    aNode.SetProperty(kindStr, value);
                }

                PrintNode(aNode);
                stack.Push(aNode);

                // Visit children
                base.Visit(node);

                if (stack.Count > 1) {
                    stack.Pop();
                }
            }
        }

        public class Parser {
            private string baseDir;
            private KeyManager keyMan;
            private Dictionary<string, bool> files;
            private bool parseAll;
            private readonly string[] allowedExtensions = {".cs"};

            public Parser(string baseDir, KeyManager keyMan, Dictionary<string, bool> files) {
                this.baseDir = baseDir;
                this.keyMan = keyMan;
                this.files = files;
                this.parseAll = this.files.Count == 0;
            }

            public bool ParseDir(string parentKey, DirectoryInfo dir) {
                var hasFiles = false;
                var absFilePath = dir.FullName;
                var relFilePath = MakeRelativePath(baseDir, absFilePath);

                var kind = new Kind("dir", kindNs, false);
                var dirNode = new AstNode("dir", kind);
                dirNode.SetProperty("filename", relFilePath);
                dirNode.parentKey = parentKey;
                dirNode.key = this.keyMan.GetKey();

                foreach (var subdir in dir.EnumerateDirectories()) {
                    if (this.ParseDir(dirNode.key, subdir)) {
                        hasFiles = true;
                    }
                }
                foreach (var file in dir.EnumerateFiles()) {
                    var ext = file.Extension;
                    if (allowedExtensions.Contains(ext)) {
                        if (this.ParseFile(dirNode.key, file.FullName)) {
                            hasFiles = true;
                        }
                    }
                }

                if (hasFiles) {
                    PrintNode(dirNode);
                }

                return hasFiles;
            }

            public bool ParseFile(string parentKey, string absFilePath) {
                var relFilePath = MakeRelativePath(this.baseDir, absFilePath);
                if (!this.parseAll) {
                    if (!this.files.ContainsKey(relFilePath)) {
                        return false;
                    }
                }
                var kind = new Kind("file", kindNs, true);
                var fileNode = new AstNode("file", kind);

                fileNode.SetProperty("filename", relFilePath);
                fileNode.SetProperty("start_column", 0); // TODO: handle in SRC lexicon https://github.com/codelingo/platform/issues/318
                fileNode.SetProperty("start_line", 0);
                fileNode.SetProperty("start_offset", 0);
                fileNode.SetProperty("end_column", 0);
                fileNode.SetProperty("end_line", 0);
                fileNode.SetProperty("end_offset", 0);
                fileNode.parentKey = parentKey;
                fileNode.key = keyMan.GetKey();
                PrintNode(fileNode);

                var nodeWalker = new AstNodeWalker(relFilePath, keyMan, fileNode.key);
                var code = File.ReadAllText(absFilePath);
                var syntaxNode = CSharpSyntaxTree.ParseText(code).GetRoot();
                nodeWalker.Visit(syntaxNode);

                return true;
            }
        }


        public class FactPropDelta {
            public string action;
            public string arg;
            public string prop;

            public FactPropDelta(string action, string arg, string prop) {
                this.action = action;
                this.arg = arg;
                this.prop = prop;
            }
        }

        public static List<FactPropDelta> ReplaceProperties(string fact, string[] properties) {
            var deltas = new List<FactPropDelta>();
            
            var propMap = new Dictionary<string, string>();
            var key = "";
            foreach (var item in properties) {
                if (key == "") {
                    key = item;
                }
                else {
                    propMap.Add(key, item);
                    key = "";
                }
            }
            
            switch (fact) {
                // No replacements yet
            }
            return deltas;
        }


        public static string MakeRelativePath(string fromPath, string toPath) {
            if (fromPath == toPath) {
                return ".";
            }

            if (string.IsNullOrEmpty(fromPath)) throw new ArgumentNullException(nameof(fromPath));
            if (string.IsNullOrEmpty(toPath)) throw new ArgumentNullException(nameof(toPath));

            if (!fromPath.StartsWith("file://")) {
                fromPath = "file://" + fromPath;
            }
            if (!toPath.StartsWith("file://")) {
                toPath = "file://" + toPath;
            }

            var fromUri = new Uri(fromPath);
            var toUri = new Uri(toPath);

            if (fromUri.Scheme != toUri.Scheme) {
                return toPath;
            } // path can't be made relative.

            var relativeUri = fromUri.MakeRelativeUri(toUri);
            var relativePath = Uri.UnescapeDataString(relativeUri.ToString());

            if (toUri.Scheme.Equals("file", StringComparison.OrdinalIgnoreCase)) {
                relativePath = relativePath.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar);
            }

            var prefix = "." + Path.DirectorySeparatorChar.ToString();
            if (!relativePath.StartsWith(prefix)) {
                relativePath = prefix + relativePath;
            }

            return relativePath;
        }

        public static void PrintNode(AstNode node) {
            var result = JsonConvert.SerializeObject(node);
            Console.WriteLine(result);
        }

        private static void Main(string[] args) {
            var method = args[0];
            switch (method) {
                case "parse-project":
                    var trunkKey = args[1];
                    var baseDirStr = args[2];
                    var files = new Dictionary<string, bool>();
                    if (args.Length > 3) {
                        for (var i = 3; i < args.Length; i++) {
                            var fileArg = args[i];
                            if (!fileArg.StartsWith("./")) {
                                fileArg = "./" + fileArg;
                            }
                            files[fileArg] = true;
                        }
                    }
                    
                    var keyMan = new KeyManager(trunkKey);
                    var parser = new Parser(baseDirStr, keyMan, files);

                    var kind = new Kind("project", kindNs, false);
                    var projectNode = new AstNode("project", kind);
                    projectNode.parentKey = "";
                    projectNode.key = trunkKey;
                    PrintNode(projectNode);

                    var baseDir = new DirectoryInfo(baseDirStr);
                    parser.ParseDir(projectNode.key, baseDir);
                    break;
                case "replace-properties":
                    var fact = args[1];
                    var properties = new ArraySegment<string>(args, 2, args.Length-3).Array;
                    var deltas = ReplaceProperties(fact, properties);
                    var result = JsonConvert.SerializeObject(deltas);
                    Console.WriteLine(result);
                    break;
                default:
                    throw new Exception(String.Format("unknown method {0}", method));
            }
        }
    }
}