class GridTable::Control
  include ActiveModel::Validations
  include ActiveModel::Conversion

  extend ActiveModel::Naming
  extend ActiveModel::Translation

  # Initializes a new model with the given +params+.
  #
  #   class Person
  #     include ActiveModel::Model
  #     attr_accessor :name, :age
  #   end
  #
  #   person = Person.new(name: 'bob', age: '18')
  #   person.name # => "bob"
  #   person.age  # => "18"
  def initialize(params = {})
    params&.each { |attr, value| public_send("#{attr}=", value) }

    super()
  end

  # Indicates if the model is persisted. Default is +false+.
  #
  #  class Person
  #    include ActiveModel::Model
  #    attr_accessor :id, :name
  #  end
  #
  #  person = Person.new(id: 1, name: 'bob')
  #  person.persisted? # => false
  def persisted?
    false
  end

  attr_writer :model, :attribute, :source, :source_class, :source_column, :source_sql, :filter, :polymorphic

  def filter(param_filter_value, records)
    return records if @filter == false

    arel_query = nil
    strategy_map = {
      exact_match: ->(col) { "(#{col}) = #{param_filter_value}" },
      prefix:      ->(col) { "(#{col}) ILIKE '#{param_filter_value}%'" },
      suffix:      ->(col) { "(#{col}) ILIKE '%#{param_filter_value}'" },
      fuzzy:       ->(col) { "(#{col}) ILIKE '%#{param_filter_value}%'" },
      array:       ->(col) { "(#{col}) @> ARRAY[#{[param_filter_value].flatten.join(',')}]" },
      date_range:  ->(_col) { "(#{col}) BETWEEN #{param_filter_value}" }
    }

    polymorphic_models.each_with_index do |klass, i|
      # TODO: implement array filtering
      arel_query = i.zero? ? strategy_map[strategy].call(polymorphic_table_with_column(klass)) : arel_query.or(strategy_map[strategy].call(polymorphic_table_with_column(klass)))
    end

    arel_query ||= strategy_map[strategy].call(table_with_column)
    prepared_records(records).where(arel_query)
  end

  def sort(param_sort_order, records)
    sort_order = %w[asc desc].include?(param_sort_order) ? param_sort_order : 'asc'

    if @polymorphic
      models = polymorphic_models
      if models.present?
        prepared_records(records).select("\"#{@model.to_s.tableize}\".*, #{polymorphic_select_sql(models)} AS #{active_source}")
                                 .order("#{active_source} #{sort_order}")
      else
        records
      end
    else
      prepared_records(records).order("#{column} #{sort_order}")
    end
  end

  def select
    "#{table_with_column} as #{column}"
  end

  def url_param
    @attribute
  end

  private

  def prepared_records(records)
    if @polymorphic
      polymorphic_models.each do |klass|
        records = records.joins("LEFT OUTER JOIN #{klass.table_name} ON #{model_fk}_id = #{klass.table_name}.id AND #{model_fk}_type = '#{klass}'")
      end
      records
    else
      joined_control? ? records.includes(active_source).references(active_source) : records
    end
  end

  def column
    @source_column || @attribute
  end

  def active_source
    @source || @model
  end

  def joined_control?
    @model != active_source
  end

  def strategy
    @filter || :fuzzy
  end

  def source_table
    klass = Object.const_get(@source_class || active_source.to_s.classify)
    klass.arel_table
  end

  def table_with_column
    @source_sql || "#{source_table.name}.#{column}"
  end

  def polymorphic_table_with_column(klass)
    @source_sql || "#{klass.arel_table.name}.#{klass.arel_table[column].name}"
  end

  def model_fk
    "#{@model.to_s.tableize}.#{@source}"
  end

  def polymorphic_select_sql(models)
    sql = ''

    models.each_with_index do |klass, i|
      if models.length == 1
        sql = "#{klass.table_name}.#{column}"
      elsif i.zero?
        sql << "(CASE WHEN #{klass.table_name}.#{column} IS NOT NULL THEN #{klass.table_name}.#{column}"
      elsif i == models.length - 1
        sql << " ELSE #{klass.table_name}.#{column} END)"
      else
        sql << " ELSIF #{klass.table_name}.#{column} IS NOT NULL THEN #{klass.table_name}.#{column}"
      end
    end

    sql
  end

  def polymorphic_models
    return [] unless @polymorphic

    if @polymorphic_models.blank?
      col = (active_source.to_s + '_type').to_sym
      @polymorphic_models = Object.const_get(@model.to_s.classify)
                                  .select(col)
                                  .uniq
                                  .where.not(col => nil)
                                  .pluck(col).map { |klass| Object.const_get(klass) }
    end

    @polymorphic_models
  end

  class << self
    def find_by_param(param, controls)
      controls.detect { |control| control.url_param == param.try(:to_sym) }
    end
  end
end
