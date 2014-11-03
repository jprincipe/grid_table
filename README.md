# GridTable

TODO: Write a gem description

## Installation

Add this line to your application's Gemfile:

    gem 'grid_table'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install grid_table

## Usage

1. Mark up your table in the index.html.haml with the GridTable HTML 5 attributes
```
  %table.grid-table{data: {url: users_path}}
    %thead
      %tr
        %th.small-5{data: { field: 'email', sort: 'true', filter: 'true', default_sort: 'asc' }} Email
        %th{data: { field: 'first_name', sort: 'true', filter: 'true' }} First Name
        %th{data: { field: 'last_name', sort: 'true', filter: 'true' }} Last Name
        %th{data: { field: 'customer_name', sort: 'true', filter: 'true' }} Customer
        %th{data: { field: 'created_at', sort: 'true', filter: 'false' }} Created
        %th
      %tr.filters
        %th
          %input{data: {field: 'email'}}
        %th
          %input{data: {field: 'first_name'}}
        %th
          %input{data: {field: 'last_name'}}
        %th
          %input{data: {field: 'customer_name'}}
        %th
        %th
    %tbody
      %tr.no-results.hide
        %td
          %h4 No Results Found
        %td
        %td
        %td
        %td
        %td
    %tcaption
      .grid-pager
        %ul.pagination
          %li
            %button#first
              First
          %li
            %button#previous
              Back
          %li#pagedisplay
          %li
            %button#next
              Next
          %li
            %button#last
              Last
          .pagination
            Results per page:
            #pagesize
```
2. Create a partial for each row of the table.  By default the partial name is ```_row.html.haml```
```html
%tr
     %td= user.email
     %td= user.first_name
     %td= user.last_name
     %td= user.customer.name
     %td= l(user.created_at.to_date)
     %td
```
3. Define the fields and how they are accessed in the ActiveRecord Model
```ruby
class User < ActiveRecord::Base
     extend GridTable::Model

     belongs_to :customer

     grid_table_control :email
     grid_table_control :first_name
     grid_table_control :last_name
     grid_table_control :created_at
     grid_table_control :customer_name,
                         source: :customer,
                         source_column: 'name'
end
```
4. Setup the controller handle the HTML response and the JS response that does the lookup of the data
```ruby
class UsersController < ApplicationController
      def index
        respond_to do |format|
          format.html {}
          format.js { grid_table_for(Users.all, index_params) }
        end
      end

      private

      def index_params
        params.permit [].concat(User.grid_table_strong_params)
      end
end
```

TODO: Fill out details about options available other than defaults

## Contributing

1. Fork it ( https://github.com/[my-github-username]/gridtable/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
