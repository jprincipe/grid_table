class GridTable::Table
  attr_reader :records, :total_rows

  def initialize
    @controls = []
  end

  def add_control(model, attribute, options)
    @controls << GridTable::Control.new(
      {
        model: model.name.underscore.to_sym,
        attribute: attribute,
        source: options[:source],
        source_class: options[:source_class],
        source_column: options[:source_column],
        filter: options[:filter],
        polymorphic: options[:polymorphic]
      })
  end

  def populate!(resource, params)
    # In Rails 5 ActionController::Parameters returns an object rather than a hash
    # It provides the to_h method in order to return a hash (with indifferent access) of safe parameters
    # Rails 4 and below returns a regular hash so we need to account for that
    @params   = params.to_h.with_indifferent_access
    @records  = resource

    filter! unless params[:skip_filtering]
    sort! unless params[:skip_sorting]
    @total_rows = @records.size
    page! unless params[:skip_paging]

    @records
  end

  def strong_params
    @controls.inject(common_strong_params) do |all_params, control|
      all_params << control.url_param
    end
  end

  private

  def common_strong_params
    [:page, :page_size, :sort, :sort_order]
  end

  def page
    [@params[:page].to_i, 0].max
  end

  def page_size
    (@params[:page_size] || 10).to_i
  end

  def filter!
    @params.each do |attribute, attribute_value|
      control = GridTable::Control.find_by_param(attribute, @controls)
      @records = control.filter(attribute_value, @records) if control.present?
    end
  end

  def sort!
    control = GridTable::Control.find_by_param(@params[:sort], @controls)

    if control.present?
      @records = control.sort(@params[:sort_order], records)
    end
  end

  def page!
    @records = @records.offset(page * page_size).limit(page_size)
  end

end
