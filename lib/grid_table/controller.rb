module GridTable
  module Controller
    def grid_table_for(resource, params, options = {})
      grid_table = resource.grid_table
      grid_table.populate!(resource, params, options)

      if block_given?
        yield grid_table.records, grid_table.total_rows
      else
        rows = []

        local = options[:local].try(:to_sym) || grid_table.records.klass.name.demodulize.underscore.to_sym
        grid_table.records.each do |record|
          rows << (render_to_string partial: (options[:partial] || 'row'), locals: { local => record })
        end

        render json: { total_rows: grid_table.total_rows, rows: rows }
      end
    end

    def grid_table_export_for(resource, params)
      grid_table = resource.grid_table
      params[:skip_paging] ||= true
      grid_table.populate!(resource, params)

      if block_given?
        yield grid_table.records
      else
        csv = grid_table.records.klass.to_csv(grid_table.records)

        send_data csv, filename: "#{grid_table.records.klass.name.demodulize.underscore}.csv"
      end
    end
  end
end
