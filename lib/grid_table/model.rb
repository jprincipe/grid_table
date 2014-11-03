module GridTable
  module Model
    attr_accessor :grid_table

    def grid_table_control(attribute, options = {})
      self.grid_table ||= GridTable::Table.new
      self.grid_table.add_control(self, attribute, options)
    end

    def grid_table_strong_params
      self.grid_table.strong_params
    end
  end
end
