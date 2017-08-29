# coding: utf-8

lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'grid_table/version'

Gem::Specification.new do |spec|
  spec.name          = 'grid_table'
  spec.version       = GridTable::VERSION
  spec.authors       = ['Jon Principe', 'Mike Raimondi']
  spec.email         = ['jonathan.principe@gmail.com']
  spec.summary       = 'Utility for powerful HTML Tables'
  spec.description   = 'Library to help manage powerful HTML Tables through the Model, View and Controller.'
  spec.homepage      = 'http://github.com/jprincipe/grid_table'
  spec.license       = 'MIT'

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler', '~> 1.6'
  spec.add_development_dependency 'rake'
end
