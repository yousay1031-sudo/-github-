#!/bin/bash

echo "Deleting drink menu items (ID 24-74)..."

for id in {24..74}; do
  response=$(curl -s -X DELETE http://localhost:3000/api/admin/menu-items/$id)
  if [ $? -eq 0 ]; then
    echo "Deleted item ID: $id"
  else
    echo "Failed to delete item ID: $id"
  fi
done

echo "All drink menu items deleted."
